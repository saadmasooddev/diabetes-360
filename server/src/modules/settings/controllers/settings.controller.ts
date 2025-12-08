import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { SettingsService } from "../service/settings.service";
import { UserService } from "../../user/service/user.service";
import { BadRequestError } from "../../../shared/errors";
import { insertFreeTierLimitsSchema, updateFreeTierLimitsSchema, insertFoodScanLimitsSchema, updateFoodScanLimitsSchema } from "../models/settings.schema";
import { handleError } from "../../../shared/middleware/errorHandler";

export class SettingsController {
  private settingsService: SettingsService;
  private userService: UserService;

  constructor() {
    this.settingsService = new SettingsService();
    this.userService = new UserService();
  }

  async getFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limits = await this.settingsService.getFreeTierLimits();
      sendSuccess(res, limits, "Free tier limits retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
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
      handleError(res, error);
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
      handleError(res, error);
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
      handleError(res, error);
    }
  }

  // Food Scan Limits Methods
  async getFoodScanLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limits = await this.settingsService.getFoodScanLimits();
      sendSuccess(res, limits, "Food scan limits retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async createFoodScanLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertFoodScanLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid food scan limits data");
      }

      const limits = await this.settingsService.createFoodScanLimits(validationResult.data);
      sendSuccess(res, limits, "Food scan limits created successfully", 201);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateFoodScanLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = updateFoodScanLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid food scan limits data");
      }

      const limits = await this.settingsService.updateFoodScanLimits(validationResult.data);
      sendSuccess(res, limits, "Food scan limits updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async upsertFoodScanLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = insertFoodScanLimitsSchema.safeParse({
        ...req.body,
      });

      if (!validationResult.success) {
        throw new BadRequestError(validationResult.error.message || "Invalid food scan limits data");
      }

      const limits = await this.settingsService.upsertFoodScanLimits(validationResult.data);
      sendSuccess(res, limits, "Food scan limits updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getUserScanStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || '';
      const user = await this.userService.getProfile(userId);
      const isPaid = user.paymentType !== 'free';
      
      const status = await this.settingsService.getUserScanStatus(userId, isPaid);
      sendSuccess(res, status, "User scan status retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

