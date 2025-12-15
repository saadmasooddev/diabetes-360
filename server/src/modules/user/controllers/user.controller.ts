import {  Response } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { UnauthorizedError } from "../../../shared/errors";
import { UserService } from "../service/user.service";
import { handleError } from "../../../shared/middleware/errorHandler";

export class UserController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }
      const user = await this.userService.getProfile(req.user.userId);

      sendSuccess(res, user, "Profile retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

}
