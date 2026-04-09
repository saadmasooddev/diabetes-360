import bcrypt from "bcrypt";
import crypto from "crypto";
import {
	type User,
	type InsertUser,
	type PhysicianData,
	type CustomerData,
	PROVIDERS,
} from "../models/user.schema";
import { AuthRepository } from "../repositories/auth.repository";
import { config } from "../../../app/config";
import {
	type JWTPayload,
	JWTService,
	type TokenPair,
} from "../../../shared/utils/jwt";
import {
	ConflictError,
	UnauthorizedError,
	BadRequestError,
} from "../../../shared/errors";
import { emailService } from "../../../shared/services/email.service";
import { ROLE_PERMISSIONS } from "server/src/shared/constants/roles";
import { TwoFactorService } from "../../twoFactor/service/twoFactor.service";
import { FcmTokenRepository } from "../../notifications/repositories/fcm-token.repository";
import type { FcmRegistrationInput } from "../../notifications/models/fcm.schema";

export interface AuthResponse {
	user: Omit<
		User & { profileData?: CustomerData | PhysicianData | null },
		"password"
	> & { permissions?: string[]};
	tokens?: TokenPair;
	emailVerificationCodeSent: boolean 
	requiresTwoFactor?: boolean;
}

export interface SignupResponse {
	emailVerificationCodeSent: boolean;
}

export class AuthService {
	private authRepository: AuthRepository;
	private twoFactorService: TwoFactorService;
	private fcmTokenRepository: FcmTokenRepository;

	constructor() {
		this.authRepository = new AuthRepository();
		this.twoFactorService = new TwoFactorService();
		this.fcmTokenRepository = new FcmTokenRepository();
	}


	async createUserForAdmin(userData: InsertUser) {
		const existingUser = await this.authRepository.getUserByEmail(
			userData.email,
		);
		if(existingUser){
			throw new ConflictError("An account with this email already exists")
		}

		const hashedPassword = await bcrypt.hash(
			userData.password!,
			config.bcryptRounds,
		);

		// Create user with hashed password, emailVerified defaults to false
		const user = await this.authRepository.createUser({
			...userData,
			password: hashedPassword,
			emailVerified: true
		});

		return user
	}

	async signup(userData: InsertUser): Promise<SignupResponse> {
		const existingUser = await this.authRepository.getUserByEmail(
			userData.email,
		);

		if (existingUser) {
			if (existingUser.emailVerified) {
				throw new ConflictError("An account with this email already exists");
			}
			return this.sendOrConfirmEmailVerificationOtp(existingUser, userData);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(
			userData.password!,
			config.bcryptRounds,
		);

		// Create user with hashed password, emailVerified defaults to false
		const user = await this.authRepository.createUser({
			...userData,
			password: hashedPassword,
		});

		// Send verification OTP (no welcome email until verified)
		let emailVerificationCodeSent = false;
		try {
			await this.createAndSendEmailVerificationOtp(user);
			emailVerificationCodeSent = true;
		} catch (err) {
			console.error("Failed to send email verification OTP:", err);
		}

		return { emailVerificationCodeSent };
	}

	/**
	 * For existing unverified user: if valid OTP already exists, return otpSent true.
	 * Otherwise send new OTP and return otpSent based on send result.
	 */
	private async sendOrConfirmEmailVerificationOtp(
		user: Awaited<ReturnType<AuthRepository["getUserByEmail"]>>,
		_userData: InsertUser,
	): Promise<SignupResponse> {
		if (!user) return {emailVerificationCodeSent : false };
		const userId = user.id;

		// If a valid (non-expired) OTP already exists, just return otpSent true so user can go to verify page
		const existingValid =
			await this.authRepository.getValidEmailVerificationTokenForUser(userId);
		if (existingValid) {
			return {emailVerificationCodeSent : true };
		}

		// Rate limit new sends
		const since = new Date();
		since.setMinutes(
			since.getMinutes() -
				config.auth.emailVerificationOtpRateLimitWindowInMinutes,
		);
		const recentCount =
			await this.authRepository.countRecentEmailVerificationCodes(
				userId,
				since,
			);
		if (recentCount >= config.auth.emailVerificationOtpMaxPerWindow) {
			throw new BadRequestError(
				`Too many verification code requests. Try again in ${config.auth.emailVerificationOtpRateLimitWindowInMinutes} minutes.`,
			);
		}

		await this.authRepository.revokeEmailVerificationCodesForUser(userId);
		try {
			await this.createAndSendEmailVerificationOtp(user);
			return {emailVerificationCodeSent : true };
		} catch (err) {
			console.error("Failed to send email verification OTP:", err);
			return {emailVerificationCodeSent : false };
		}
	}

	private async createAndSendEmailVerificationOtp(
		user: { id: string; email: string; firstName: string; lastName: string },
	): Promise<void> {
		const code = crypto.randomInt(100_000, 999_999).toString();
		const expiresAt = new Date();
		expiresAt.setMinutes(
			expiresAt.getMinutes() +
				config.auth.emailVerificationOtpExpiryInMinutes,
		);
		await this.authRepository.createTokenForUser({
			userId: user.id,
			token: `EVC_${code}`,
			expiresAt,
		});
		const userName =
			`${user.firstName} ${user.lastName}`.trim() || "there";
		await emailService.sendEmailVerificationOtp(user.email, code, userName);
	}

	async verifyEmail(email: string, code: string): Promise<void> {
		const user = await this.authRepository.getUserByEmail(email);
		if (!user) {
			throw new UnauthorizedError("Invalid or expired verification code");
		}
		if (user.emailVerified) {
			return; // already verified
		}
		const trimmedCode = code.trim();
		if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
			throw new BadRequestError("Verification code must be 6 digits");
		}
		const stored = await this.authRepository.getEmailVerificationCodeToken(
			`EVC_${trimmedCode}`,
		);
		if (!stored || stored.userId !== user.id) {
			throw new UnauthorizedError("Invalid or expired verification code");
		}
		await this.authRepository.markPasswordResetTokenAsUsed(
			`EVC_${trimmedCode}`,
		);
		await this.authRepository.updateUser(user.id, { emailVerified: true });
	}

	async resendVerificationOtp(email: string): Promise<SignupResponse> {
		const user = await this.authRepository.getUserByEmail(email);
		if (!user) {
			// Don't reveal if email exists
			return {emailVerificationCodeSent : false };
		}
		if (user.emailVerified) {
			return {emailVerificationCodeSent : false };
		}
		const since = new Date();
		since.setMinutes(
			since.getMinutes() -
				config.auth.emailVerificationOtpRateLimitWindowInMinutes,
		);
		const recentCount =
			await this.authRepository.countRecentEmailVerificationCodes(
				user.id,
				since,
			);
		if (recentCount >= config.auth.emailVerificationOtpMaxPerWindow) {
			throw new BadRequestError(
				`Too many verification code requests. Try again in ${config.auth.emailVerificationOtpRateLimitWindowInMinutes} minutes.`,
			);
		}
		await this.authRepository.revokeEmailVerificationCodesForUser(user.id);
		try {
			await this.createAndSendEmailVerificationOtp(user);
			return {emailVerificationCodeSent : true };
		} catch (err) {
			console.error("Failed to resend verification OTP:", err);
			return {emailVerificationCodeSent : false };
		}
	}


	async requestSignInCode(email: string): Promise<AuthResponse> {
		const user = await this.authRepository.getUserByEmail(email);

		if (!user) {
			throw new UnauthorizedError("Invalid credentials")
		}

		if (!user.emailVerified) {
			return {
				user: { ...user},
		emailVerificationCodeSent: true,
				requiresTwoFactor: false
			}
		}

		if (user.provider !== PROVIDERS.MANUAL) {
			throw new BadRequestError(
				"Sign-in codes are only available for email/password accounts. Please use your password or social login.",
			);
		}

		const since = new Date();
		since.setMinutes(since.getMinutes() - config.auth.signInCodeRateLimitWindowInMinutes );
		const recentCount = await this.authRepository.countRecentSignInCodes(
			user.id,
			since,
		);
		if (recentCount >= config.auth.signInCodeMaxPerWindow ) {
			throw new BadRequestError(
				`Too many sign-in code requests. Please try again in ${config.auth.signInCodeRateLimitWindowInMinutes} minutes or sign in with your password.`,
			);
		}

		const code = crypto.randomInt(100_000, 999_999).toString();
		const expiresAt = new Date();
		expiresAt.setMinutes(
			expiresAt.getMinutes() + config.auth.signInCodeExpiryInMinutes,
		);

		await this.authRepository.revokeSignInCodesForUser(user.id);
		await this.authRepository.createTokenForUser({
			userId: user.id,
			token: `SIC_${code}`,
			expiresAt,
		});

		const userName =
			`${user.firstName} ${user.lastName}`.trim() || "there";
		await emailService.sendSignInCodeEmail(email, code, userName);

		return {
			user: { ...user, },
emailVerificationCodeSent: false ,
			requiresTwoFactor: false
		}
	}

	
	async loginWithEmailCode(
		email: string,
		code: string,
	): Promise<AuthResponse> {
		const user = await this.authRepository.getUserByEmail(email);

		if (!user) {
			throw new UnauthorizedError("Invalid credentials");
		}

		if (!user.emailVerified) {
			return {
				user: {...user, },
        emailVerificationCodeSent: true ,
				requiresTwoFactor: false
			}
		}

		const trimmedCode = code.trim();
		if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
			throw new BadRequestError("Verification code must be 6 digits");
		}

		const stored = await this.authRepository.getSignInCodeToken(
			`SIC_${trimmedCode}`,
		);
		if (!stored || stored.userId !== user.id) {
			throw new UnauthorizedError("Invalid or expired sign-in code");
		}

		await this.authRepository.markPasswordResetTokenAsUsed(`SIC_${trimmedCode}`);

		const tokens = await this.createTokens({
			userId: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		});

		const { password: _, profileData, ...userWithoutPassword } = user;
		const userRole = user.role;
		const response: AuthResponse = {
			user: {
				...userWithoutPassword,
				profileData: user.profileData as CustomerData | PhysicianData,
				permissions: [...(ROLE_PERMISSIONS[userRole] || [])],
			},
			emailVerificationCodeSent: false,
			tokens,
			requiresTwoFactor: false,
		};
		return response;
	}

	async login(
		email: string,
		password: string,
	): Promise<AuthResponse> {
		const user = await this.authRepository.getUserByEmail(email);

		if (!user) {
			throw new UnauthorizedError("Invalid credentials");
		}

		if (!user.emailVerified) {
			return {
				user: { ...user, },
emailVerificationCodeSent: true ,
				requiresTwoFactor: false,
			}
		}

		// For OAuth users, password might be null
		if (!user.password) {
			throw new UnauthorizedError("Please use your social login method");
		}

		// Compare hashed password
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			throw new UnauthorizedError("Password is incorrect");
		}

		// Check if 2FA is enabled for this user
		const twoFactorStatus = await this.twoFactorService.get2FAStatus(user.id);

		if (twoFactorStatus.enabled && twoFactorStatus.verified) {
			// Return response indicating 2FA is required (no tokens yet)
			const { password: _, profileData, ...userWithoutPassword } = user;
			const userRole = user.role;
			return {
				user: {
					...userWithoutPassword,
					profileData: profileData as CustomerData | PhysicianData,
					permissions: [...(ROLE_PERMISSIONS[userRole] || [])],
				},
					emailVerificationCodeSent: false,
				tokens: {
					accessToken: "",
					refreshToken: "",
				} as TokenPair, // Empty tokens until 2FA is verified
				requiresTwoFactor: true,
			};
		}

		const tokens = await this.createTokens({
			userId: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		});
		// const refreshToken = await this.authRepository.getValidRefreshToken(
		//   user.id
		// );
		// try {
		//   if (!refreshToken) throw new Error();
		//   JWTService.verifyRefreshToken(refreshToken.token);
		//   tokens.refreshToken = refreshToken.token;
		// } catch {
		// }

		const {
			password: __,
			profileData: profileData2,
			...userWithoutPassword2
		} = user;
		const userRole = user.role;
		const response: AuthResponse = {
			user: {
				...userWithoutPassword2,
				profileData: user.profileData as CustomerData | PhysicianData,
				permissions: [...(ROLE_PERMISSIONS[userRole] || [])],
			},
			emailVerificationCodeSent: false,
			tokens,
			requiresTwoFactor: false,
		};
		return response;
	}

	/**
	 * Verify 2FA token and complete login
	 */
	async verify2FALogin(
		email: string,
		token: string,
	): Promise<AuthResponse> {
		const user = await this.authRepository.getUserByEmail(email);

		if (!user) {
			throw new UnauthorizedError("Invalid credentials");
		}

		// Verify 2FA token
		const isValid = await this.twoFactorService.verifyToken(user.id, token);
		if (!isValid) {
			throw new UnauthorizedError("Invalid verification code");
		}

		// Generate tokens
		const tokens = await this.createTokens({
			userId: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
		});

		const { password: _, profileData, ...userWithoutPassword } = user;
		const userRole = user.role;
		const response: AuthResponse = {
			user: {
				...userWithoutPassword,
				profileData: profileData as CustomerData | PhysicianData,
				permissions: [...(ROLE_PERMISSIONS[userRole] || [])],
			},
			emailVerificationCodeSent: false,
			tokens,
			requiresTwoFactor: false,
		};
		return response;
	}

	async refreshTokens(refreshToken: string): Promise<TokenPair> {
		// Verify refresh token
		const payload = JWTService.verifyRefreshToken(refreshToken);
		if (!payload.tokenId) {
			throw new BadRequestError("Invalid refresh token provided");
		}

		const storedToken = await this.authRepository.getRefreshToken(
			payload.tokenId,
		);
		if (!storedToken) {
			throw new UnauthorizedError("Invalid refresh token");
		}

		// Get user
		const user = await this.authRepository.getUser(payload.userId);
		if (!user) {
			throw new UnauthorizedError("User not found");
		}

		const tokens = await this.createTokens({
			userId: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			tokenId: payload.tokenId,
		});

		return tokens;
	}

	async logout(
		refreshToken: string,
		fcm?: FcmRegistrationInput,
	): Promise<void> {
		const payload = JWTService.verifyAccessToken(refreshToken);
		if (!payload.tokenId) {
			throw new BadRequestError("invalid refresh token");
		}
		await this.authRepository.revokeRefreshToken(payload.tokenId);
		if (fcm) {
			await this.fcmTokenRepository.deleteToken(
				payload.userId,
				fcm.token,
				fcm.deviceType,
			);
		}
	}

	async logoutAll(userId: string): Promise<void> {
		await this.authRepository.revokeAllUserTokens(userId);
	}

	async forgotPassword(email: string): Promise<void> {
		const user = await this.authRepository.getUserByEmail(email);

		// Always return success to prevent email enumeration
		if (!user) {
			return;
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

		// Revoke any existing reset tokens for this user
		await this.authRepository.revokeAllPasswordResetTokens(user.id);

		// Store the new reset token
		await this.authRepository.createTokenForUser({
			userId: user.id,
			token: resetToken,
			expiresAt,
		});

		// Send password reset email
		try {
			await emailService.sendPasswordResetEmail(
				user.email,
				resetToken,
				`${user.firstName} ${user.lastName}`.trim(),
			);
		} catch (error) {
			console.error("Failed to send password reset email:", error);
			throw new Error("Failed to send password reset email");
		}
	}

	async resetPassword(token: string, newPassword: string): Promise<void> {
		// Get the reset token
		const resetToken = await this.authRepository.getPasswordResetToken(token);

		if (!resetToken) {
			throw new BadRequestError("Invalid or expired reset token");
		}

		// Check if token is expired
		if (resetToken.expiresAt < new Date()) {
			throw new BadRequestError("Reset token has expired");
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

		// Update user password
		await this.authRepository.updateUserPassword(
			resetToken.userId,
			hashedPassword,
		);

		// Mark token as used
		await this.authRepository.markPasswordResetTokenAsUsed(token);

		// Revoke all refresh tokens for security
		await this.authRepository.revokeAllUserTokens(resetToken.userId);
	}

	async changeUserPassword(
		userId: string,
		oldPassword: string,
		newPassword: string,
	) {
		const user = await this.authRepository.getUserById(userId);
		if (!user) {
			throw new UnauthorizedError();
		}

		if (!user.password) {
			throw new BadRequestError("Password not found");
		}

		const passwordMatch = await bcrypt.compare(oldPassword, user.password);
		if (!passwordMatch) {
			throw new BadRequestError("Invalid old password provided");
		}

		const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
		await this.authRepository.updateUserPassword(userId, hashedPassword);
	}

	async getAllUsers(): Promise<Omit<User, "password">[]> {
		const users = await this.authRepository.getAllUsers();
		return users;
	}

	async getUserById(id: string): Promise<Omit<User, "password"> | undefined> {
		const user = await this.authRepository.getUserById(id);
		if (!user) return undefined;
		const { password, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	async updateUser(
		id: string,
		updateData: Partial<InsertUser>,
	): Promise<Omit<User, "password">> {
		if (updateData.password) {
			updateData.password = await bcrypt.hash(
				updateData.password,
				config.bcryptRounds,
			);
		}

		const user = await this.authRepository.updateUser(id, updateData);
		const { password, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	async deleteUser(id: string): Promise<void> {
		await this.authRepository.deleteUser(id);
	}

	private async createTokens(
		payload: Omit<JWTPayload, "iat" | "exp" | "permissions">,
	): Promise<TokenPair> {
		try {
			const permissions = [...(ROLE_PERMISSIONS[payload.role] || [])];
			const expiresAt = new Date();
			expiresAt.setTime(
				expiresAt.getTime() + config.refreshTokenExpiresIn * 1000,
			);

			const { tokenId, ...tokens } = JWTService.generateTokenPair({
				...payload,
				permissions,
			});
			await this.authRepository.createRefreshToken({
				userId: payload.userId,
				tokenId,
				expiresAt,
			});
			return tokens;
		} catch (error) {
			throw error;
		}
	}
}
