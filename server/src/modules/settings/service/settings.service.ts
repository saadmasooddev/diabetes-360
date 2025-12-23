import { SettingsRepository } from "../repository/settings.repository";
import type {
  InsertFreeTierLimits,
  UpdateFreeTierLimits,
  FreeTierLimits,
  InsertFoodScanLimits,
  UpdateFoodScanLimits,
  FoodScanLimits,
  ExtendedLimits,
} from "../models/settings.schema";
import { BadRequestError } from "server/src/shared/errors";
import { EXERCISE_TYPE_ENUM, MetricType } from "../../health/models/health.schema";

export class SettingsService {
  private readonly settingsRepository: SettingsRepository;
  private readonly DEFAULT_LIMITS = {
    glucoseLimit: 2,
    stepsLimit: 2,
    waterLimit: 2,
    discountedConsultationQuota: 0,
    freeConsultationQuota:0,
  };
  private readonly DEFAULT_FOOD_SCAN_LIMITS = {
    freeUserLimit: 5,
    paidUserLimit: 20,
  };

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }
  async getLogLimits(): Promise<ExtendedLimits> {
    const limits = await this.settingsRepository.getLogLimits();
    const foodScanLimits = await this.getFoodScanLimits();

    // If still no limits found, return default limits (this shouldn't happen in production)
    if (!limits) {
      // Return a default structure
      return {
        glucoseLimit: this.DEFAULT_LIMITS.glucoseLimit,
        stepsLimit: this.DEFAULT_LIMITS.stepsLimit,
        waterLimit: this.DEFAULT_LIMITS.waterLimit,
        discountedConsultationQuota: this.DEFAULT_LIMITS.discountedConsultationQuota, 
        freeConsultationQuota: this.DEFAULT_LIMITS.freeConsultationQuota,
        foodScanLimits: {
          freeTier: this.DEFAULT_FOOD_SCAN_LIMITS.freeUserLimit,
          paidTier: this.DEFAULT_FOOD_SCAN_LIMITS.paidUserLimit,
        },
      };
    }

    return {
      ...limits,
      foodScanLimits: {
        freeTier: foodScanLimits.freeUserLimit,
        paidTier: foodScanLimits.paidUserLimit,
      },
    };
  }

  async getLimitForMetricType(
    metricType: MetricType
  ): Promise<number> {
    const limits = await this.getLogLimits();

    switch (metricType) {
      case EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE:
        return limits.glucoseLimit;
      case EXERCISE_TYPE_ENUM.STEPS:
        return limits.stepsLimit;
      case EXERCISE_TYPE_ENUM.WATER_INTAKE:
        return limits.waterLimit;
      default:
        throw new BadRequestError("Invalid metric type");
    }
  }

  async createFreeTierLimits(
    data: InsertFreeTierLimits
  ): Promise<FreeTierLimits> {
    return await this.settingsRepository.createFreeTierLimits(data);
  }

  async updateFreeTierLimits(
    data: UpdateFreeTierLimits
  ): Promise<FreeTierLimits> {
    return await this.settingsRepository.updateFreeTierLimits(data);
  }

  async upsertFreeTierLimits(
    data: InsertFreeTierLimits
  ): Promise<FreeTierLimits> {
    return await this.settingsRepository.upsertFreeTierLimits(data);
  }

  // Food Scan Limits Methods
  async getFoodScanLimits(): Promise<FoodScanLimits> {
    let limits = await this.settingsRepository.getFoodScanLimits();

    if (!limits) {
      // Return default structure if no limits configured
      return {
        id: "",
        freeUserLimit: this.DEFAULT_FOOD_SCAN_LIMITS.freeUserLimit,
        paidUserLimit: this.DEFAULT_FOOD_SCAN_LIMITS.paidUserLimit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return limits;
  }

  async createFoodScanLimits(
    data: InsertFoodScanLimits
  ): Promise<FoodScanLimits> {
    return await this.settingsRepository.createFoodScanLimits(data);
  }

  async updateFoodScanLimits(
    data: UpdateFoodScanLimits
  ): Promise<FoodScanLimits> {
    return await this.settingsRepository.updateFoodScanLimits(data);
  }

  async upsertFoodScanLimits(
    data: InsertFoodScanLimits
  ): Promise<FoodScanLimits> {
    return await this.settingsRepository.upsertFoodScanLimits(data);
  }

  async getUserScanStatus(
    userId: string,
    isPaid: boolean
  ): Promise<{ canScan: boolean; currentCount: number; limit: number }> {
    return await this.settingsRepository.getUserScanStatus(userId, isPaid);
  }

  async incrementUserScanCount(userId: string): Promise<void> {
    await this.settingsRepository.incrementUserScanCount(userId);
  }
  async getUserDailyScanCount(userId: string): Promise<number> {
    return await this.settingsRepository.getUserDailyScanCount(userId);
  }

}
