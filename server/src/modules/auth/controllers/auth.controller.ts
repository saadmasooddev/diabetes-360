import type { Request, Response, NextFunction } from "express";
import { insertUserSchema, type InsertUser, insertBiometricDeviceSchema, loginWithBioMetricSchema } from "../models/user.schema";
import { type AuthResponse, AuthService } from "../services/auth.service";
import { SUCCESS_MESSAGES } from "../../../app/constants";
import { sendSuccess } from "../../../app/utils/response";
import { BadRequestError, ValidationError } from "../../../shared/errors";
import { fcmRegistrationSchema } from "@shared/schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import type { AuthenticatedRequest } from "server/src/shared/middleware/auth";

export class AuthController {
	private authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	async signup(req: Request, res: Response): Promise<void> {
		try {
			// Validate request body
			const validatedData = insertUserSchema.parse({
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				password: req.body.password,
				email: req.body.email,
				provider: "manual",
			});

			const signupResponse = await this.authService.signup(validatedData);

			sendSuccess(
				res,
				{ emailVerificationCodeSent: signupResponse.emailVerificationCodeSent },
				signupResponse.emailVerificationCodeSent
					? "Verification code sent. Please check your email."
					: "Account created but we couldn't send the verification email. You can try again.",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async verifyEmail(req: Request, res: Response): Promise<void> {
		try {
			const { email, code } = req.body;
			if (!email || !code) {
				throw new BadRequestError("Email and verification code are required");
			}
			await this.authService.verifyEmail(email, code);
			sendSuccess(
				res,
				null,
				"Email verified successfully. You can now sign in.",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async resendVerificationOtp(req: Request, res: Response): Promise<void> {
		try {
			const { email } = req.body;
			if (!email) {
				throw new BadRequestError("Email is required");
			}
			const result = await this.authService.resendVerificationOtp(email);
			sendSuccess(
				res,
				{ emailVerificationCodeSent: result.emailVerificationCodeSent },
				result.emailVerificationCodeSent
					? "Verification code sent. Please check your email."
					: "We couldn't send the code. Please try again later.",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	private loginMessage(authResponse: AuthResponse, message: string) {
		const rotueToVerificationPage =
			authResponse.emailVerificationCodeSent === true;
		return rotueToVerificationPage
			? "Kindly verify your email to continue."
			: message;
	}

	async login(req: Request, res: Response): Promise<void> {
		try {
			const { email, password, requestSignInCode, emailSignInCode, biometric } = req.body;

			if(biometric !== undefined && biometric !== null){

				const bioMetricDataParsed = loginWithBioMetricSchema.safeParse(
					biometric
				)

				if(!bioMetricDataParsed.success){
					throw new ValidationError(undefined, bioMetricDataParsed.error)
				}
				const authResponse =await this.authService.loginWithBiometric(bioMetricDataParsed.data)
				sendSuccess(
					res,
					authResponse,
					this.loginMessage(authResponse, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL)
				)
				return
			}

			if (!email) {
				throw new BadRequestError("Email is required");
			}


			// Request sign-in code (send OTP to email)
			if (requestSignInCode === true) {
				const result = await this.authService.requestSignInCode(email);
				sendSuccess(
					res,
					result,
					this.loginMessage(
						result,
						"Sign-in code sent to your email. It expires in 5 minutes.",
					),
				);
				return;
			}

			if (emailSignInCode != null && emailSignInCode !== "") {
				if (typeof emailSignInCode !== "string") {
					throw new BadRequestError("Sign-in code must be a string");
				}
				const authResponse = await this.authService.loginWithEmailCode(
					email,
					emailSignInCode,
				);
				sendSuccess(
					res,
					authResponse,
					this.loginMessage(authResponse, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL),
				);
				return;
			}

			// Standard password login
			if (!password) {
				throw new BadRequestError("Password is required");
			}

			const authResponse = await this.authService.login(email, password);

			// If 2FA is required, return response without tokens
			if (authResponse.requiresTwoFactor) {
				sendSuccess(
					res,
					authResponse,
					this.loginMessage(authResponse, "Two-factor authentication required"),
				);
				return;
			}

			sendSuccess(
				res,
				authResponse,
				this.loginMessage(authResponse, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL),
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async verify2FALogin(req: Request, res: Response): Promise<void> {
		try {
			const { email, token } = req.body;

			if (!email || !token) {
				throw new BadRequestError("Email and verification token are required");
			}

			if (token.length !== 6) {
				throw new BadRequestError("Verification token must be 6 digits");
			}

			const authResponse = await this.authService.verify2FALogin(email, token);

			sendSuccess(res, authResponse, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async refreshTokens(req: Request, res: Response): Promise<void> {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				throw new BadRequestError("Refresh token is required");
			}

			const tokens = await this.authService.refreshTokens(refreshToken);

			sendSuccess(res, { tokens }, "Tokens refreshed successfully");
		} catch (error: any) {
			handleError(res, error, { error: error.message });
		}
	}

	private parseOptionalFcmFromBody(fcm?: unknown) {
		if (!fcm) {
			return;
		}
		const parsed = fcmRegistrationSchema.safeParse(fcm);
		if (!parsed.success) {
			return;
		}
		return parsed.data;
	}

	async logout(req: Request, res: Response): Promise<void> {
		try {
			const { refreshToken, fcmToken, deviceType } = req.body;
			const fcm = this.parseOptionalFcmFromBody({
				token: fcmToken,
				deviceType,
			});

			if (!refreshToken) {
				throw new BadRequestError("Refresh token is required");
			}

			await this.authService.logout(refreshToken, fcm);

			sendSuccess(res, null, "Logged out successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async forgotPassword(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const { email } = req.body;

			if (!email) {
				throw new BadRequestError("Email is required");
			}

			await this.authService.forgotPassword(email);

			sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async resetPassword(req: Request, res: Response): Promise<void> {
		try {
			const { token, password } = req.body;

			if (!token || !password) {
				throw new BadRequestError("Token and password are required");
			}

			if (password.length < 6) {
				throw new BadRequestError(
					"Password must be at least 6 characters long",
				);
			}

			await this.authService.resetPassword(token, password);

			sendSuccess(res, null, "Password reset successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async changeUserPassword(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const { oldPassword, newPassword } = req.body;

			if (!oldPassword || !newPassword) {
				throw new BadRequestError("Old password and new password are required");
			}

			if (oldPassword === newPassword) {
				throw new BadRequestError(
					"Old password and new password cannot be the same",
				);
			}

			await this.authService.changeUserPassword(
				req.user?.userId || "",
				oldPassword,
				newPassword,
			);

			sendSuccess(res, null, "Password changed successfully");
		} catch (error) {
			handleError(res, error);
		}
	}

	async  createBiometricDevice(req:AuthenticatedRequest, res: Response){
		try {
			const userId = req.user?.userId
			const biometricData = insertBiometricDeviceSchema.safeParse({
				...req.body,
				userId 
			})
			if(!biometricData.success){
				throw new ValidationError(undefined, biometricData.error)
			}
			await this.authService.createBiometricDevice(biometricData.data)
			sendSuccess(res, null, "Biometric device created successfully")
			
		} catch (error) {
			handleError(res, error)
			
		}

	}
}
