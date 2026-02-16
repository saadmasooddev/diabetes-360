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
import { BadRequestError, NotFoundError } from "server/src/shared/errors";
import {
	EXERCISE_TYPE_ENUM,
	type MetricType,
} from "../../health/models/health.schema";

export class SettingsService {
	private readonly settingsRepository: SettingsRepository;

	constructor() {
		this.settingsRepository = new SettingsRepository();
	}
	async getLogLimits(): Promise<ExtendedLimits> {
		const limits = await this.settingsRepository.getLogLimits();
		const foodScanLimits = await this.getFoodScanLimits();

		if (!limits) {
			throw new NotFoundError("No limits found");
		}

		return {
			...limits,
			foodScanLimits: {
				freeTier: foodScanLimits.freeUserLimit,
				paidTier: foodScanLimits.paidUserLimit,
			},
		};
	}

	async getLimitForMetricType(metricType: MetricType): Promise<number> {
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
		data: InsertFreeTierLimits,
	): Promise<FreeTierLimits> {
		return await this.settingsRepository.createFreeTierLimits(data);
	}

	async updateFreeTierLimits(
		data: UpdateFreeTierLimits,
	): Promise<FreeTierLimits> {
		return await this.settingsRepository.updateFreeTierLimits(data);
	}

	async upsertFreeTierLimits(
		data: InsertFreeTierLimits,
	): Promise<FreeTierLimits> {
		return await this.settingsRepository.upsertFreeTierLimits(data);
	}

	// Food Scan Limits Methods
	async getFoodScanLimits(): Promise<FoodScanLimits> {
		const limits = await this.settingsRepository.getFoodScanLimits();

		if (!limits) {
			throw new NotFoundError("No food scan limits found");
		}

		return limits;
	}

	async createFoodScanLimits(
		data: InsertFoodScanLimits,
	): Promise<FoodScanLimits> {
		return await this.settingsRepository.createFoodScanLimits(data);
	}

	async updateFoodScanLimits(
		data: UpdateFoodScanLimits,
	): Promise<FoodScanLimits> {
		return await this.settingsRepository.updateFoodScanLimits(data);
	}

	async upsertFoodScanLimits(
		data: InsertFoodScanLimits,
	): Promise<FoodScanLimits> {
		return await this.settingsRepository.upsertFoodScanLimits(data);
	}

	async getUserScanStatus(
		userId: string,
		isPaid: boolean,
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
