import { Response } from 'express';
import { type AuthenticatedRequest } from '../../../shared/middleware/auth';
import { sendSuccess } from '../../../app/utils/response';
import { FoodScannerService } from '../service/foodScanner.service';
import { BadRequestError } from '../../../shared/errors';
import { handleError } from '../../../shared/middleware/errorHandler';
import { UserService } from '../../user/service/user.service';

export class FoodScannerController {
  private foodScannerService: FoodScannerService;
  private userService: UserService;

  constructor() {
    this.foodScannerService = new FoodScannerService();
    this.userService = new UserService();
  }

  async scanFood(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || '';
      const file = req.file;

      if (!file) {
        throw new BadRequestError('No image file provided');
      }


      const user = await this.userService.getProfile(userId);
      const isPremium = user.paymentType !== 'free';
      // Process the image
      const result = await this.foodScannerService.scanFoodImage(
        file.buffer,
        file.mimetype,
        isPremium
      );

      sendSuccess(res, result, 'Food scanned successfully');
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

