import bcrypt from "bcrypt";
import crypto from "crypto";
import { type User, type InsertUser, RefreshToken, PhysicianData, CustomerData } from "../models/user.schema";
import { AuthRepository } from "../repositories/auth.repository";
import { config } from "../../../app/config";
import { JWTService, type TokenPair } from "../../../shared/utils/jwt";
import { ConflictError, UnauthorizedError, BadRequestError } from "../../../shared/errors";
import { emailService } from "../../../shared/services/email.service";
import { UserRole } from "server/src/shared/constants/roles";

export interface AuthResponse {
  user: Omit<User &{ profileData?: CustomerData | PhysicianData | null }, 'password'>;
  tokens: TokenPair;
}

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async signup(userData: InsertUser): Promise<AuthResponse> {
    const existingUserByEmail = await this.authRepository.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new ConflictError("An account with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password!, config.bcryptRounds);

    // Create user with hashed password (profileComplete defaults to false in schema)
    const user = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    const userWithProfile = await this.authRepository.getUserByEmail(user.email);

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    });

    await this.createRefreshToken(user.id, tokens.refreshToken);


    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`.trim(),
        userData.password!
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the signup if email fails
    }

    // Return user without password, with profileData
    if (!userWithProfile) {
      throw new Error("Failed to retrieve user after creation");
    }
    
    const { password: _, profileData, ...userWithoutPassword } = userWithProfile;
    return {
      user: {
        ...userWithoutPassword,
        profileData: (profileData as CustomerData | PhysicianData | null | undefined) || null,
      },
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.authRepository.getUserByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // For OAuth users, password might be null
    if (!user.password) {
      throw new UnauthorizedError("Please use your social login method");
    }

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    });

    await this.createRefreshToken(user.id, tokens.refreshToken);

    const { password: _, profileData , ...userWithoutPassword } = user;
    return {
      user: {
        ...userWithoutPassword,
        profileData: user.profileData as CustomerData | PhysicianData,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);
    
    // Check if token exists in database and is not revoked
    const storedToken = await this.authRepository.getRefreshToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Get user
    const user = await this.authRepository.getUser(payload.userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Generate new tokens
    const newTokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    });

    // Revoke old refresh token
    await this.authRepository.revokeRefreshToken(refreshToken);

    await this.createRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.authRepository.revokeRefreshToken(refreshToken);
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
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Revoke any existing reset tokens for this user
    await this.authRepository.revokeAllPasswordResetTokens(user.id);

    // Store the new reset token
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.firstName} ${user.lastName}`.trim()
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Get the reset token
    const resetToken = await this.authRepository.getPasswordResetToken(token);
    
    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestError('Reset token has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update user password
    await this.authRepository.updateUserPassword(resetToken.userId, hashedPassword);

    // Mark token as used
    await this.authRepository.markPasswordResetTokenAsUsed(token);

    // Revoke all refresh tokens for security
    await this.authRepository.revokeAllUserTokens(resetToken.userId);
  }


  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.authRepository.getAllUsers();
    return users;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | undefined> {
    const user = await this.authRepository.getUserById(id);
    if (!user) return undefined;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<Omit<User, 'password'>> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, config.bcryptRounds);
    }

    const user = await this.authRepository.updateUser(id, updateData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    await this.authRepository.deleteUser(id);
  }

  private createRefreshToken(userId: string, token: string): Promise<RefreshToken> {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + config.refreshTokenExpiresIn * 1000);
    return this.authRepository.createRefreshToken({
      userId,
      token,
      expiresAt,
    });
  }
}
