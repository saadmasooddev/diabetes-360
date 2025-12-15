import { Response } from 'express';
import { type AuthenticatedRequest } from '../../../shared/middleware/auth';
import { sendSuccess } from '../../../app/utils/response';
import { FoodService } from '../service/food.service';
import { BadRequestError, ForbiddenError } from '../../../shared/errors';
import { handleError } from '../../../shared/middleware/errorHandler';
import { UserService } from '../../user/service/user.service';
import { SettingsService } from '../../settings/service/settings.service';
import { CustomerData } from '../../auth/models/user.schema';

export class FoodController {
  private foodService: FoodService;
  private userService: UserService;
  private settingsService: SettingsService;

  constructor() {
    this.foodService = new FoodService();
    this.userService = new UserService();
    this.settingsService = new SettingsService();
  }

  async scanFood(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || '';
      const file = req.file;

      if (!file) {
        throw new BadRequestError('No image file provided');
      }

      const user = await this.userService.getProfile(userId);
      const profileData = user.profileData as unknown as CustomerData;
      const isPremium = user.paymentType !== 'free';

      // Check if user can scan food today
      const scanStatus = await this.settingsService.getUserScanStatus(userId, isPremium);
      if (!scanStatus.canScan) {
        throw new ForbiddenError(
          `Daily food scan limit reached. You have used ${scanStatus.currentCount} out of ${scanStatus.limit} scans today.`
        );
      }

      // Process the image
      const result = await this.foodService.scanFoodImage(
        file.buffer,
        file.mimetype,
        isPremium,
        profileData,
        userId
      );

      // Increment scan count after successful scan
      await this.settingsService.incrementUserScanCount(userId);

      // Add can_scan_food flag to response
      const responseWithFlag = {
        ...result,
        can_scan_food: scanStatus.currentCount + 1 < scanStatus.limit,
        remaining_scans: Math.max(0, scanStatus.limit - (scanStatus.currentCount + 1)),
      };

      sendSuccess(res, responseWithFlag, 'Food scanned successfully');
    } catch (error: any) {
      console.log(error)
      handleError(res, error);
    }
  }

  async getPaidUserDailyData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || '';

      const result = await this.foodService.getPaidUserDailyData(userId);
      sendSuccess(res, result, 'Nutrition requirements retrieved successfully');
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getConsumedNutrients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || '';

      const result = await this.foodService.getConsumedNutrients(userId);
      sendSuccess(res, result, 'Consumed nutrients retrieved successfully');
    } catch (error: any) {
      handleError(res, error);
    }
  }



}

