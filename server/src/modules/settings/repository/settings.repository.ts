import { db } from "../../../app/config/db";
import {
	freeTierLimits,
	foodScanLimits,
	foodScanLogs,
} from "../models/settings.schema";
import type {
	InsertFreeTierLimits,
	UpdateFreeTierLimits,
	FreeTierLimits,
	InsertFoodScanLimits,
	UpdateFoodScanLimits,
	FoodScanLimits,
	FoodScanLogs,
} from "../models/settings.schema";
import { eq, and, sql } from "drizzle-orm";

export class SettingsRepository {
	async getLogLimits(): Promise<FreeTierLimits | null> {
		const [limits] = await db.select().from(freeTierLimits).limit(1);

		return limits || null;
	}

	async createFreeTierLimits(
		data: InsertFreeTierLimits,
	): Promise<FreeTierLimits> {
		const [limits] = await db
			.insert(freeTierLimits)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return limits;
	}

	async updateFreeTierLimits(
		data: UpdateFreeTierLimits,
	): Promise<FreeTierLimits> {
		const [limits] = await db
			.update(freeTierLimits)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		if (!limits) {
			throw new Error("Free tier limits not found");
		}

		return limits;
	}

	async upsertFreeTierLimits(
		data: InsertFreeTierLimits,
	): Promise<FreeTierLimits> {
		const existing = await this.getLogLimits();

		if (existing) {
			return await this.updateFreeTierLimits(data);
		} else {
			return await this.createFreeTierLimits(data);
		}
	}

	// Food Scan Limits Methods
	async getFoodScanLimits(): Promise<FoodScanLimits | null> {
		const [limits] = await db.select().from(foodScanLimits).limit(1);

		return limits || null;
	}

	async createFoodScanLimits(
		data: InsertFoodScanLimits,
	): Promise<FoodScanLimits> {
		const [limits] = await db
			.insert(foodScanLimits)
			.values({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		return limits;
	}

	async updateFoodScanLimits(
		data: UpdateFoodScanLimits,
	): Promise<FoodScanLimits> {
		const [limits] = await db
			.update(foodScanLimits)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.returning();

		if (!limits) {
			throw new Error("Food scan limits not found");
		}

		return limits;
	}

	async upsertFoodScanLimits(
		data: InsertFoodScanLimits,
	): Promise<FoodScanLimits> {
		const existing = await this.getFoodScanLimits();

		if (existing) {
			return await this.updateFoodScanLimits(data);
		} else {
			return await this.createFoodScanLimits(data);
		}
	}

	// Food Scan Logs Methods
	async getUserDailyScanCount(
		userId: string,
		scanDate: Date = new Date(),
	): Promise<number> {
		// Use date in YYYY-MM-DD format for PostgreSQL date type
		const dateStr = scanDate.toISOString().split("T")[0];

		const [log] = await db
			.select()
			.from(foodScanLogs)
			.where(
				and(
					eq(foodScanLogs.userId, userId),
					eq(foodScanLogs.scanDate, dateStr as any),
				),
			)
			.limit(1);

		return log?.scanCount || 0;
	}

	async incrementUserScanCount(
		userId: string,
		scanDate: Date = new Date(),
	): Promise<FoodScanLogs> {
		// Use date in YYYY-MM-DD format for PostgreSQL date type
		const dateStr = scanDate.toISOString().split("T")[0];

		// Try to update existing record
		const [updated] = await db
			.update(foodScanLogs)
			.set({
				scanCount: sql`${foodScanLogs.scanCount} + 1`,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(foodScanLogs.userId, userId),
					eq(foodScanLogs.scanDate, dateStr as any),
				),
			)
			.returning();

		if (updated) {
			return updated;
		}

		// If no existing record, create a new one
		const [newLog] = await db
			.insert(foodScanLogs)
			.values({
				userId,
				scanDate: dateStr as any,
				scanCount: 1,
			})
			.returning();

		return newLog;
	}

	async getUserScanStatus(
		userId: string,
		isPaid: boolean,
		scanDate: Date = new Date(),
	): Promise<{ canScan: boolean; currentCount: number; limit: number }> {
		const limits = await this.getFoodScanLimits();
		if (!limits) {
			// If no limits configured, allow scanning
			return { canScan: true, currentCount: 0, limit: Infinity };
		}

		const limit = isPaid ? limits.paidUserLimit : limits.freeUserLimit;
		const currentCount = await this.getUserDailyScanCount(userId, scanDate);

		return {
			canScan: currentCount < limit,
			currentCount,
			limit,
		};
	}
}
