import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { SettingsService } from "../service/settings.service";
import { BadRequestError } from "../../../shared/errors";
import { insertFreeTierLimitsSchema, updateFreeTierLimitsSchema } from "../models/settings.schema";

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  async getFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limits = await this.settingsService.getFreeTierLimits();
      sendSuccess(res, limits, "Free tier limits retrieved successfully");
    } catch (error: any) {
      next(error);
    }
  }

  async createFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertFreeTierLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid free tier limits data");
      }

      const limits = await this.settingsService.createFreeTierLimits(validationResult.data);
      sendSuccess(res, limits, "Free tier limits created successfully");
    } catch (error: any) {
      next(error);
    }
  }

  async updateFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = updateFreeTierLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid free tier limits data");
      }

      const limits = await this.settingsService.updateFreeTierLimits(validationResult.data);
      sendSuccess(res, limits, "Free tier limits updated successfully");
    } catch (error: any) {
      next(error);
    }
  }

  async upsertFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {

      const validationResult = insertFreeTierLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid free tier limits data");
      }

      const limits = await this.settingsService.upsertFreeTierLimits(validationResult.data);
      sendSuccess(res, limits, "Free tier limits updated successfully");
    } catch (error: any) {
      next(error);
    }
  }
}

