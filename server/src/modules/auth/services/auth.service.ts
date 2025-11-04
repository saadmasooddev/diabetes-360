import bcrypt from "bcrypt";
import crypto from "crypto";
import { type User, type InsertUser } from "../models/user.schema";
import { AuthRepository } from "../repositories/auth.repository";
import { config } from "../../../app/config";
import { JWTService, type TokenPair } from "../../../shared/utils/jwt";
import { ConflictError, UnauthorizedError, BadRequestError } from "../../../shared/errors";
import { emailService } from "../../../shared/services/email.service";
import { UserRole } from "server/src/shared/constants/roles";

export interface AuthResponse {
  user: Omit<User, 'password'>;
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

    // Check if user already exists by username
    const existingUserByUsername = await this.authRepository.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new ConflictError("An account with this username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password!, config.bcryptRounds);

    // Create user with hashed password (profileComplete defaults to false in schema)
    const user = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.authRepository.createRefreshToken({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    });

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        user.fullName || user.username,
        userData.password!
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the signup if email fails
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
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
      username: user.username,
      role: user.role as UserRole,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.authRepository.createRefreshToken({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
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
      username: user.username,
      role: user.role as UserRole,
    });

    // Revoke old refresh token
    await this.authRepository.revokeRefreshToken(refreshToken);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.authRepository.createRefreshToken({
      userId: user.id,
      token: newTokens.refreshToken,
      expiresAt,
    });

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
        user.fullName || user.username
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

  // Admin methods
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
    // If password is being updated, hash it
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
}
