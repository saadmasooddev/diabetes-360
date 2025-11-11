import { type Request, Response, NextFunction } from "express";
import { insertUserSchema, type InsertUser } from "../models/user.schema";
import { AuthService } from "../services/auth.service";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../../app/constants";
import { sendSuccess } from "../../../app/utils/response";
import {  BadRequestError } from "../../../shared/errors";
import { handleError } from "../../../shared/middleware/errorHandler";

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

      const authResponse = await this.authService.signup(validatedData);

      sendSuccess(res, {
        user: authResponse.user,
        tokens: authResponse.tokens,
      }, SUCCESS_MESSAGES.ACCOUNT_CREATED) 
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new BadRequestError("Email and password are required");
      }

      const authResponse = await this.authService.login(email, password);

      sendSuccess(res, {
        user: authResponse.user,
        tokens: authResponse.tokens,
      }, SUCCESS_MESSAGES.LOGIN_SUCCESSFUL);
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
      handleError(res, error);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new BadRequestError("Refresh token is required");
      }

      await this.authService.logout(refreshToken);

      sendSuccess(res, null, "Logged out successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async resetPassword(req: Request, res: Response ): Promise<void> {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        throw new BadRequestError("Token and password are required");
      }

      if (password.length < 6) {
        throw new BadRequestError("Password must be at least 6 characters long");
      }

      await this.authService.resetPassword(token, password);

      sendSuccess(res, null, "Password reset successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
