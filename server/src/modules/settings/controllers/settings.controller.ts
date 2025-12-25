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

  async getLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limits = await this.settingsService.getLogLimits();
      sendSuccess(res, limits, "Limits retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Backward compatibility - keep old method name
  async getFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return this.getLimits(req, res, next);
  }

  async createLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const freeTierData: any = {};
      const foodScanData: any = {};

      // Extract health metric limits
      if (body.glucoseLimit !== undefined) freeTierData.glucoseLimit = body.glucoseLimit;
      if (body.stepsLimit !== undefined) freeTierData.stepsLimit = body.stepsLimit;
      if (body.waterLimit !== undefined) freeTierData.waterLimit = body.waterLimit;
      if (body.discountedConsultationQuota !== undefined) freeTierData.discountedConsultationQuota = body.discountedConsultationQuota;
      if (body.freeConsultationQuota !== undefined) freeTierData.freeConsultationQuota = body.freeConsultationQuota;

      // Extract food scan limits
      if (body.freeUserLimit !== undefined) foodScanData.freeUserLimit = body.freeUserScanLimit;
      if (body.paidUserLimit !== undefined) foodScanData.paidUserLimit = body.paidUserScanLimit;

      // Create free tier limits if any health metric data provided
      if (Object.keys(freeTierData).length > 0) {
        const validationResult = insertFreeTierLimitsSchema.safeParse(freeTierData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        await this.settingsService.createFreeTierLimits(validationResult.data);
      }

      // Create food scan limits if any food scan data provided
      if (Object.keys(foodScanData).length > 0) {
        const validationResult = insertFoodScanLimitsSchema.safeParse(foodScanData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        await this.settingsService.createFoodScanLimits(validationResult.data);
      }

      // Return combined result - use getFreeTierLimits to get the full combined response
      const combinedResult = await this.settingsService.getLogLimits();

      sendSuccess(res, combinedResult, "Limits created successfully", 201);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Backward compatibility - keep old method name
  async createFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return this.createLimits(req, res, next);
  }

  async updateLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const freeTierData: any = {};
      const foodScanData: any = {};

      // Extract health metric limits
      if (body.glucoseLimit !== undefined) freeTierData.glucoseLimit = body.glucoseLimit;
      if (body.stepsLimit !== undefined) freeTierData.stepsLimit = body.stepsLimit;
      if (body.waterLimit !== undefined) freeTierData.waterLimit = body.waterLimit;
      if (body.discountedConsultationQuota !== undefined) freeTierData.discountedConsultationQuota = body.discountedConsultationQuota;
      if (body.freeConsultationQuota !== undefined) freeTierData.freeConsultationQuota = body.freeConsultationQuota;

      // Extract food scan limits
      if (body.freeUserLimit !== undefined) foodScanData.freeUserLimit = body.freeUserScanLimit;
      if (body.paidUserLimit !== undefined) foodScanData.paidUserLimit = body.paidUserScanLimit;

      const results: any = {};

      // Update free tier limits if any health metric data provided
      if (Object.keys(freeTierData).length > 0) {
        const validationResult = updateFreeTierLimitsSchema.safeParse(freeTierData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        results.freeTierLimits = await this.settingsService.updateFreeTierLimits(validationResult.data);
      } else {
        // Get existing free tier limits if not updating
        results.freeTierLimits = await this.settingsService.getLogLimits();
      }

      // Update food scan limits if any food scan data provided
      if (Object.keys(foodScanData).length > 0) {
        const validationResult = updateFoodScanLimitsSchema.safeParse(foodScanData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        results.foodScanLimits = await this.settingsService.updateFoodScanLimits(validationResult.data);
      } else {
        // Get existing food scan limits if not updating
        const foodScanLimits = await this.settingsService.getFoodScanLimits();
        if (foodScanLimits) {
          results.foodScanLimits = foodScanLimits;
        }
      }

      // Return combined result - use getFreeTierLimits to get the full combined response
      const combinedResult = await this.settingsService.getLogLimits();

      sendSuccess(res, combinedResult, "Limits updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Backward compatibility - keep old method name
  async updateFreeTierLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return this.updateLimits(req, res, next);
  }

  async upsertLimits(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const freeTierData: any = {};
      const foodScanData: any = {};

      // Extract health metric limits
      if (body.glucoseLimit !== undefined) freeTierData.glucoseLimit = body.glucoseLimit;
      if (body.stepsLimit !== undefined) freeTierData.stepsLimit = body.stepsLimit;
      if (body.waterLimit !== undefined) freeTierData.waterLimit = body.waterLimit;
      if (body.discountedConsultationQuota !== undefined) freeTierData.discountedConsultationQuota = body.discountedConsultationQuota;
      if (body.freeConsultationQuota !== undefined) freeTierData.freeConsultationQuota = body.freeConsultationQuota;

      // Extract food scan limits
      if (body.freeUserLimit !== undefined) foodScanData.freeUserLimit = body.freeUserScanLimit;
      if (body.paidUserLimit !== undefined) foodScanData.paidUserLimit = body.paidUserScanLimit;

      // Upsert free tier limits if any health metric data provided
      if (Object.keys(freeTierData).length > 0) {
        const validationResult = insertFreeTierLimitsSchema.safeParse(freeTierData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        await this.settingsService.upsertFreeTierLimits(validationResult.data);
      }

      // Upsert food scan limits if any food scan data provided
      if (Object.keys(foodScanData).length > 0) {
        const validationResult = insertFoodScanLimitsSchema.safeParse(foodScanData);
        if (!validationResult.success) {
          throw validationResult.error;
        }
        await this.settingsService.upsertFoodScanLimits(validationResult.data);
      }

      // Return combined result - use getFreeTierLimits to get the full combined response
      const combinedResult = await this.settingsService.getLogLimits();

      sendSuccess(res, combinedResult, "Limits updated successfully");
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

