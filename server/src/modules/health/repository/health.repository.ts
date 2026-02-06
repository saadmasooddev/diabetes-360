import { db } from "../../../app/config/db";
import {
	healthMetrics,
	exerciseLogs,
	healthMetricTargets,
	healthInsights,
	metricTypes,
	EXERCISE_TYPE_ENUM,
	ACTIVITY_TYPE_ENUM,
} from "../models/health.schema";
import { eq, desc, and, gte, lte, sql, isNotNull, isNull } from "drizzle-orm";
import type {
	InsertHealthMetric,
	HealthMetric,
	MertricRecord,
	InsertExerciseLog,
	ExerciseLog,
	InsertHealthMetricTarget,
	HealthMetricTarget,
	HealthInsight,
	ExtendedHealthMetric,
	MetricType,
} from "../models/health.schema";
import type { PgTable } from "drizzle-orm/pg-core";
import { BadRequestError } from "server/src/shared/errors";

export type ChartData = {
	value: number;
	recordedAt: Date;
};

export type HealthPagination = {
	total: number;
	limit: number;
	offset: number;
};
export interface HealthInsightsData {
	insights: Array<HealthInsights>;
	overallHealthSummary: string;
	whatToDoNext: Array<HealthTips>;
}
export interface HealthInsights {
	name: MetricType;
	insight: string;
}

export interface HealthTips {
	name: string;
	tip: string;
}

export class HealthRepository {
	async getTodaysMetricCount(
		userId: string,
		startOfDay: string,
		metricType?: MetricType,
	): Promise<number> {
		let table: PgTable = healthMetrics;

		let conditions: any[] = [
			eq(healthMetrics.userId, userId),
			sql`DATE(${healthMetrics.recordedAt}) between DATE(${startOfDay}) and DATE(${startOfDay})`,
		];

		// If metricType is specified, filter by that specific metric
		if (metricType === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE) {
			conditions.push(isNotNull(healthMetrics.bloodSugar));
		} else if (metricType === EXERCISE_TYPE_ENUM.STEPS) {
			table = exerciseLogs;
			conditions = [
				eq(exerciseLogs.userId, userId),
				sql`DATE(${exerciseLogs.recordedAt}) between DATE(${startOfDay}) and DATE(${startOfDay})`,
				isNotNull(exerciseLogs.steps),
			];
		} else if (metricType === EXERCISE_TYPE_ENUM.WATER_INTAKE) {
			conditions.push(isNotNull(healthMetrics.waterIntake));
		}

		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(table)
			.where(and(...conditions));

		return result[0]?.count || 0;
	}

	async createMetric(data: InsertHealthMetric): Promise<HealthMetric> {
		const [metric] = await db
			.insert(healthMetrics)
			.values({
				userId: data.userId,
				bloodSugar: data.bloodSugar?.toString() || null,
				waterIntake: data.waterIntake?.toString() || null,
				heartRate: data.heartRate || null,
				recordedAt: new Date(data.recordedAt),
			})
			.returning();
		return metric;
	}

	async getTodaysMetricTotal(
		userId: string,
		metricType: MetricType,
		date: string,
	): Promise<number> {
		// Steps are stored in exercise_logs

		const metricTypeMap: Record<MetricType, () => Promise<number>> = {
			[EXERCISE_TYPE_ENUM.STEPS]: async () => {
				const result = await db
					.select({
						total: sql<number>`COALESCE(SUM(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
					})
					.from(exerciseLogs)
					.where(
						and(
							eq(exerciseLogs.userId, userId),
							sql`DATE(${exerciseLogs.recordedAt}) between DATE(${date}) and DATE(${date})`,
							isNotNull(exerciseLogs.steps),
						),
					);
				return parseFloat(result[0]?.total?.toString() || "0");
			},
			[EXERCISE_TYPE_ENUM.WATER_INTAKE]: async () => {
				const result = await db
					.select({
						total: sql<number>`COALESCE(SUM(${healthMetrics.waterIntake})::numeric, 0)`,
					})
					.from(healthMetrics)
					.where(
						and(
							eq(healthMetrics.userId, userId),
							sql`DATE(${healthMetrics.recordedAt}) between DATE(${date}) and DATE(${date})`,
							isNotNull(healthMetrics.waterIntake),
						),
					);

				return parseFloat(result[0]?.total?.toString() || "0");
			},
			[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE]: async () => {
				return 0;
			},
			[EXERCISE_TYPE_ENUM.HEART_RATE]: async () => {
				return 0;
			},
		};

		const f = metricTypeMap[metricType];
		if (!f) {
			throw new BadRequestError("Failed to get todays metric total");
		}
		return await f();
	}

	async getLatestMetric(
		userId: string,
		date: string,
	): Promise<{
		current: Partial<ExtendedHealthMetric>;
		previous: Partial<ExtendedHealthMetric>;
	}> {
		const latestBloogSugarPromise = db
			.select()
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					isNotNull(healthMetrics.bloodSugar),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(2);

		// Get today's totals for steps and water instead of latest values
		const todaysStepsTotalPromise = this.getTodaysMetricTotal(
			userId,
			EXERCISE_TYPE_ENUM.STEPS,
			date,
		);
		const todaysWaterTotalPromise = this.getTodaysMetricTotal(
			userId,
			EXERCISE_TYPE_ENUM.WATER_INTAKE,
			date,
		);

		// Get previous day totals for comparison
		const yesterday = new Date(date);
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(0, 0, 0, 0);
		const endOfYesterday = new Date(yesterday);
		endOfYesterday.setHours(23, 59, 59, 999);

		// Steps are in exercise_logs
		const previousStepsPromise = db
			.select({
				total: sql<number>`COALESCE(SUM(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
			})
			.from(exerciseLogs)
			.where(
				and(
					eq(exerciseLogs.userId, userId),
					sql`DATE(${exerciseLogs.recordedAt}) between DATE(${yesterday}) and DATE(${endOfYesterday})`,
					isNotNull(exerciseLogs.steps),
				),
			);

		const previousWaterPromise = db
			.select({
				total: sql<number>`COALESCE(SUM(${healthMetrics.waterIntake})::numeric, 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${yesterday}) and DATE(${endOfYesterday})`,
					isNotNull(healthMetrics.waterIntake),
				),
			);

		const latestHeartRatePromise = db
			.select()
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					isNotNull(healthMetrics.heartRate),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(2);

		const [
			latestBloogSugar,
			todaysStepsTotal,
			todaysWaterTotal,
			previousSteps,
			previousWater,
			latestHeartRate,
		] = await Promise.all([
			latestBloogSugarPromise,
			todaysStepsTotalPromise,
			todaysWaterTotalPromise,
			previousStepsPromise,
			previousWaterPromise,
			latestHeartRatePromise,
		]);

		const previousStepsTotal = parseFloat(
			previousSteps[0]?.total?.toString() || "0",
		);
		const previousWaterTotal = parseFloat(
			previousWater[0]?.total?.toString() || "0",
		);

		return {
			current: {
				bloodSugar: latestBloogSugar[0]?.bloodSugar || null,
				waterIntake: todaysWaterTotal.toString(),
				heartRate: latestHeartRate[0]?.heartRate || null,
				steps: Math.round(todaysStepsTotal),
			},
			previous: {
				bloodSugar: latestBloogSugar[1]?.bloodSugar || null,
				waterIntake: previousWaterTotal.toString(),
				heartRate: latestHeartRate[1]?.heartRate || null,
				steps: Math.round(previousStepsTotal),
			},
		};
	}

	async getAggregatedStatistics(
		userId: string,
		total: boolean,
		date: string,
	): Promise<{
		glucose: { daily: number; weekly: number; monthly: number };
		water: { daily: number; weekly: number; monthly: number };
		steps: { daily: number; weekly: number; monthly: number };
		heartRate: { daily: number; weekly: number; monthly: number };
	}> {
		const weekStart = new Date(date);
		weekStart.setDate(weekStart.getDate() - 7);
		weekStart.setHours(0, 0, 0, 0);
		const monthStart = new Date(date);
		monthStart.setDate(monthStart.getDate() - 30);
		monthStart.setHours(0, 0, 0, 0);

		const dailyGlucosePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${date}) and DATE(${date})`,
					isNotNull(healthMetrics.bloodSugar),
				),
			);

		const dailyWaterPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${date}) and DATE(${date})`,
					isNotNull(healthMetrics.waterIntake),
				),
			);

		// Steps are in exercise_logs
		const dailyStepsPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
			})
			.from(exerciseLogs)
			.where(
				and(
					eq(exerciseLogs.userId, userId),
					sql`DATE(${exerciseLogs.recordedAt}) between DATE(${date}) and DATE(${date})`,
					isNotNull(exerciseLogs.steps),
				),
			);

		const dailyHeartRatePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${date}) and DATE(${date})`,
					isNotNull(healthMetrics.heartRate),
				),
			);

		// Weekly averages
		const weeklyGlucosePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${weekStart}) and DATE(${date})`,
					isNotNull(healthMetrics.bloodSugar),
				),
			);

		const weeklyWaterPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${weekStart}) and DATE(${date})`,
					isNotNull(healthMetrics.waterIntake),
				),
			);

		// Steps are in exercise_logs
		const weeklyStepsPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
			})
			.from(exerciseLogs)
			.where(
				and(
					eq(exerciseLogs.userId, userId),
					sql`DATE(${exerciseLogs.recordedAt}) between DATE(${weekStart}) and DATE(${date})`,
					isNotNull(exerciseLogs.steps),
				),
			);

		const weeklyHeartRatePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${weekStart}) and DATE(${date})`,
					isNotNull(healthMetrics.heartRate),
				),
			);

		// Monthly averages
		const monthlyGlucosePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${monthStart}) and DATE(${date})`,
					isNotNull(healthMetrics.bloodSugar),
				),
			);

		const monthlyWaterPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${monthStart}) and DATE(${date})`,
					isNotNull(healthMetrics.waterIntake),
				),
			);

		// Steps are in exercise_logs
		const monthlyStepsPromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
			})
			.from(exerciseLogs)
			.where(
				and(
					eq(exerciseLogs.userId, userId),
					sql`DATE(${exerciseLogs.recordedAt}) between DATE(${monthStart}) and DATE(${date})`,
					isNotNull(exerciseLogs.steps),
				),
			);

		const monthlyHeartRatePromise = db
			.select({
				avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
			})
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					sql`DATE(${healthMetrics.recordedAt}) between DATE(${monthStart}) and DATE(${date})`,
					isNotNull(healthMetrics.heartRate),
				),
			);

		const [
			dailyGlucose,
			dailyWater,
			dailySteps,
			dailyHeartRate,
			weeklyGlucose,
			weeklyWater,
			weeklySteps,
			weeklyHeartRate,
			monthlyGlucose,
			monthlyWater,
			monthlySteps,
			monthlyHeartRate,
		] = await Promise.all([
			dailyGlucosePromise,
			dailyWaterPromise,
			dailyStepsPromise,
			dailyHeartRatePromise,
			weeklyGlucosePromise,
			weeklyWaterPromise,
			weeklyStepsPromise,
			weeklyHeartRatePromise,
			monthlyGlucosePromise,
			monthlyWaterPromise,
			monthlyStepsPromise,
			monthlyHeartRatePromise,
		]);
		const result = {
			glucose: {
				daily: Math.round(Number(dailyGlucose[0]?.avg || 0)),
				weekly: Math.round(Number(weeklyGlucose[0]?.avg || 0)),
				monthly: Math.round(Number(monthlyGlucose[0]?.avg || 0)),
				total: 0,
			},
			water: {
				daily: Number(dailyWater[0]?.avg || 0),
				weekly: Number(weeklyWater[0]?.avg || 0),
				monthly: Number(monthlyWater[0]?.avg || 0),
				total: 0,
			},
			steps: {
				daily: Math.round(Number(dailySteps[0]?.avg || 0)),
				weekly: Math.round(Number(weeklySteps[0]?.avg || 0)),
				monthly: Math.round(Number(monthlySteps[0]?.avg || 0)),
				total: 0,
			},
			heartRate: {
				daily: Math.round(Number(dailyHeartRate[0]?.avg || 0)),
				weekly: Math.round(Number(weeklyHeartRate[0]?.avg || 0)),
				monthly: Math.round(Number(monthlyHeartRate[0]?.avg || 0)),
				total: 0,
			},
		};
		if (total) {
			const totalGlucosePromise = db
				.select({
					total: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
				})
				.from(healthMetrics)
				.where(
					and(
						eq(healthMetrics.userId, userId),
						isNotNull(healthMetrics.bloodSugar),
					),
				);

			const totalWaterPromise = db
				.select({
					total: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
				})
				.from(healthMetrics)
				.where(
					and(
						eq(healthMetrics.userId, userId),
						isNotNull(healthMetrics.waterIntake),
					),
				);

			// Steps are in exercise_logs
			const totalStepsPromise = db
				.select({
					total: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
				})
				.from(exerciseLogs)
				.where(
					and(eq(exerciseLogs.userId, userId), isNotNull(exerciseLogs.steps)),
				);

			const totalHeartRatePromise = db
				.select({
					total: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
				})
				.from(healthMetrics)
				.where(
					and(
						eq(healthMetrics.userId, userId),
						isNotNull(healthMetrics.heartRate),
					),
				);

			const [totalGlucose, totalWater, totalSteps, totalHeartRate] =
				await Promise.all([
					totalGlucosePromise,
					totalWaterPromise,
					totalStepsPromise,
					totalHeartRatePromise,
				]);
			result.glucose.total = Number(totalGlucose[0]?.total);
			result.water.total = Number(totalWater[0]?.total);
			result.steps.total = Number(totalSteps[0]?.total || 0);
			result.heartRate.total = Number(totalHeartRate[0]?.total || 0);
		}

		return result;
	}

	async getFilteredMetrics(
		userId: string,
		startDate: string,
		endDate: string,
		types: MetricType[],
		limit?: number,
		offset?: number,
	): Promise<{
		bloodSugarRecords: MertricRecord[];
		waterIntakeRecords: MertricRecord[];
		stepsRecords: MertricRecord[];
		heartBeatRecords: MertricRecord[];
		pagination: {
			bloodSugar: HealthPagination;
			waterIntake: HealthPagination;
			steps: HealthPagination;
			heartBeat: HealthPagination;
		};
	}> {
		const baseConditions = [
			eq(healthMetrics.userId, userId),
			sql`DATE(${healthMetrics.recordedAt}) between DATE(${startDate}) and DATE(${endDate})`,
		];

		const result = {
			bloodSugarRecords: [] as MertricRecord[],
			waterIntakeRecords: [] as MertricRecord[],
			stepsRecords: [] as MertricRecord[],
			heartBeatRecords: [] as MertricRecord[],
			pagination: {
				bloodSugar: { total: 0, limit: limit || 0, offset: offset || 0 },
				waterIntake: { total: 0, limit: limit || 0, offset: offset || 0 },
				steps: { total: 0, limit: limit || 0, offset: offset || 0 },
				heartBeat: { total: 0, limit: limit || 0, offset: offset || 0 },
			},
		};

		// If no types specified, return all types
		const requestedTypes = types.length > 0 ? types : metricTypes;

		// Fetch blood sugar records
		const metricTypeMap: Record<MetricType, () => Promise<void>> = {
			[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE]: async () => {
				const bloodSugarQueryPromise = db
					.select({
						id: healthMetrics.id,
						userId: healthMetrics.userId,
						value: healthMetrics.bloodSugar,
						recordedAt: healthMetrics.recordedAt,
					})
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.bloodSugar)))
					.orderBy(desc(healthMetrics.recordedAt));

				// Get total count
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.bloodSugar)));

				result.pagination.bloodSugar.total = count;

				// Apply pagination if provided
				if (limit && offset) {
					bloodSugarQueryPromise.limit(limit).offset(offset);
				}

				result.bloodSugarRecords =
					(await bloodSugarQueryPromise) as MertricRecord[];
			},
			[EXERCISE_TYPE_ENUM.WATER_INTAKE]: async () => {
				const waterIntakeQuery = db
					.select({
						id: healthMetrics.id,
						userId: healthMetrics.userId,
						value: healthMetrics.waterIntake,
						recordedAt: healthMetrics.recordedAt,
					})
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.waterIntake)))
					.orderBy(desc(healthMetrics.recordedAt));

				// Get total count
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.waterIntake)));

				result.pagination.waterIntake.total = count;

				// Apply pagination if provided
				if (limit !== undefined && offset !== undefined) {
					result.waterIntakeRecords = (await waterIntakeQuery
						.limit(limit)
						.offset(offset)) as MertricRecord[];
				} else {
					result.waterIntakeRecords =
						(await waterIntakeQuery) as MertricRecord[];
				}
			},
			[EXERCISE_TYPE_ENUM.STEPS]: async () => {
				const stepsBaseConditions = [
					eq(exerciseLogs.userId, userId),
					sql`DATE(${exerciseLogs.recordedAt}) between DATE(${startDate}) and DATE(${endDate})`,
				];

				const stepsQuery = db
					.select({
						id: exerciseLogs.id,
						userId: exerciseLogs.userId,
						value: exerciseLogs.steps,
						recordedAt: exerciseLogs.recordedAt,
					})
					.from(exerciseLogs)
					.where(and(...stepsBaseConditions, isNotNull(exerciseLogs.steps)))
					.orderBy(desc(exerciseLogs.recordedAt));

				// Get total count
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(exerciseLogs)
					.where(and(...stepsBaseConditions, isNotNull(exerciseLogs.steps)));

				result.pagination.steps.total = count;

				// Apply pagination if provided
				if (limit !== undefined && offset !== undefined) {
					result.stepsRecords = (await stepsQuery
						.limit(limit)
						.offset(offset)) as MertricRecord[];
				} else {
					result.stepsRecords = (await stepsQuery) as MertricRecord[];
				}
			},
			[EXERCISE_TYPE_ENUM.HEART_RATE]: async () => {
				const heartBeatQuery = db
					.select({
						id: healthMetrics.id,
						userId: healthMetrics.userId,
						value: healthMetrics.heartRate,
						recordedAt: healthMetrics.recordedAt,
					})
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.heartRate)))
					.orderBy(desc(healthMetrics.recordedAt));

				// Get total count
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(healthMetrics)
					.where(and(...baseConditions, isNotNull(healthMetrics.heartRate)));

				result.pagination.heartBeat.total = count;

				// Apply pagination if provided
				if (limit !== undefined && offset !== undefined) {
					result.heartBeatRecords = (await heartBeatQuery
						.limit(limit)
						.offset(offset)) as MertricRecord[];
				} else {
					result.heartBeatRecords = (await heartBeatQuery) as MertricRecord[];
				}
			},
		};
		await Promise.all(requestedTypes.map((t) => metricTypeMap[t]?.()));

		return result;
	}

	async createExerciseLogsBatch(
		data: InsertExerciseLog[],
	): Promise<ExerciseLog[]> {
		if (data.length === 0) return [];

		const logs = await db
			.insert(exerciseLogs)
			.values(
				data.map((d) => ({
					userId: d.userId,
					exerciseType: d.exerciseType,
					exerciseName: d.exerciseName,
					calories: d.calories,
					activityType: d.activityType,
					pace: d.pace || null,
					sets: d.sets || null,
					weight: d.weight || null,
					steps: d.steps ? d.steps.toString() : null,
					muscle: d.muscle || null,
					duration: Number(d.duration) || null,
					repitition: d.repitition || null,
					recordedAt: new Date(d.recordedAt),
				})),
			)
			.returning();
		return logs;
	}

	async getStrengthProgressLogs(
		userId: string,
		startDate: Date,
		endDate: Date,
	): Promise<
		Array<{
			recordedAt: string;
			value: number;
			pushups: number;
			squats: number;
			chinups: number;
			situps: number;
		}>
	> {
		// Note: The exercise_logs structure has changed and no longer uses count-based exercises
		// This method returns empty array as the structure now uses calories, activityType, etc.
		return [];
	}

	// Health Metric Targets Methods
	async getRecommendedTargets(): Promise<HealthMetricTarget[]> {
		return await db
			.select()
			.from(healthMetricTargets)
			.where(isNull(healthMetricTargets.userId));
	}

	async getUserTargets(userId: string): Promise<HealthMetricTarget[]> {
		return await db
			.select()
			.from(healthMetricTargets)
			.where(eq(healthMetricTargets.userId, userId));
	}

	async getTargetsForUser(userId: string): Promise<{
		recommended: HealthMetricTarget[];
		user: HealthMetricTarget[];
	}> {
		const [recommended, user] = await Promise.all([
			this.getRecommendedTargets(),
			this.getUserTargets(userId),
		]);
		return { recommended, user };
	}

	async getTargetByMetricType(
		userId: string | null,
		metricType: MetricType,
	): Promise<HealthMetricTarget | null> {
		const conditions: any[] = [eq(healthMetricTargets.metricType, metricType)];

		if (userId === null) {
			conditions.push(isNull(healthMetricTargets.userId));
		} else {
			conditions.push(eq(healthMetricTargets.userId, userId));
		}

		const [target] = await db
			.select()
			.from(healthMetricTargets)
			.where(and(...conditions))
			.limit(1);

		return target || null;
	}

	async upsertTarget(
		data: InsertHealthMetricTarget,
	): Promise<HealthMetricTarget> {
		const existing = await this.getTargetByMetricType(
			data.userId || null,
			data.metricType,
		);

		if (existing) {
			const [updated] = await db
				.update(healthMetricTargets)
				.set({
					targetValue: data.targetValue.toString(),
					updatedAt: new Date(),
				})
				.where(eq(healthMetricTargets.id, existing.id))
				.returning();
			return updated;
		}
		const [created] = await db
			.insert(healthMetricTargets)
			.values({
				userId: data.userId || null,
				metricType: data.metricType,
				targetValue: data.targetValue.toString(),
			})
			.returning();
		return created;
	}

	async deleteUserTarget(
		userId: string,
		metricType: MetricType,
	): Promise<void> {
		await db
			.delete(healthMetricTargets)
			.where(
				and(
					eq(healthMetricTargets.userId, userId),
					eq(healthMetricTargets.metricType, metricType),
				),
			);
	}

	async upsertTargetsBatch(
		targets: InsertHealthMetricTarget[],
	): Promise<HealthMetricTarget[]> {
		const results: HealthMetricTarget[] = [];

		await Promise.all(
			targets.map(async (t) => {
				const result = await this.upsertTarget(t);
				results.push(result);
			}),
		);

		return results;
	}

	// Health Insights Methods
	async getHealthInsightsByUserId(
		userId: string,
		date?: string,
	): Promise<HealthInsight | null> {
		const conditions = [eq(healthInsights.userId, userId)];
		if (date) {
			conditions.push(sql`DATE(${healthInsights.createdAt}) = DATE(${date})`);
		}

		const [insight] = await db
			.select()
			.from(healthInsights)
			.where(and(...conditions))
			.orderBy(desc(healthInsights.updatedAt))
			.limit(1);

		return insight || null;
	}

	async createOrUpdateHealthInsights(
		userId: string,
		date: string,
		data: HealthInsightsData,
	): Promise<HealthInsight> {
		const existing = await this.getHealthInsightsByUserId(userId, date);

		if (existing) {
			const [updated] = await db
				.update(healthInsights)
				.set({
					insights: data.insights,
					overallHealthSummary: data.overallHealthSummary,
					whatToDoNext: data.whatToDoNext,
					updatedAt: new Date(),
				})
				.where(eq(healthInsights.id, existing.id))
				.returning();

			return updated;
		}
		const [created] = await db
			.insert(healthInsights)
			.values({
				userId,
				insights: data.insights,
				overallHealthSummary: data.overallHealthSummary,
				whatToDoNext: data.whatToDoNext,
			})
			.returning();

		return created;
	}

	async getCaloriesByActivityType(
		userId: string,
		startDate: Date,
		endDate: Date,
		sameDates: boolean,
	): Promise<{
		totals: {
			cardio: number;
			strength_training: number;
			stretching: number;
			total: number;
		};
		chartData: {
			cardio: Array<ChartData>;
			strength_training: Array<ChartData>;
			stretching: Array<ChartData>;
		};
	}> {
		const caloriesSum = sql<number>`CAST(SUM(${exerciseLogs.calories}) AS INTEGER)`;
		const recordedAtCast =
			sql<Date>`CAST(${exerciseLogs.recordedAt} AS DATE)`.as("rec");

		const groupBy = [recordedAtCast];

		const columns = {
			value: sameDates ? exerciseLogs.calories : caloriesSum,
			recordedAt: sameDates ? exerciseLogs.recordedAt : recordedAtCast,
		};

		const condition = [
			and(
				eq(exerciseLogs.userId, userId),
				gte(exerciseLogs.recordedAt, startDate),
			),
		];

		if (!sameDates) {
			condition.push(lte(exerciseLogs.recordedAt, endDate));
		}

		const promises = [];

		const cardioPromise = db
			.select(columns)
			.from(exerciseLogs)
			.where(
				and(
					...condition,
					eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.CARDIO),
				),
			);

		const strengthTrainingPromise = db
			.select(columns)
			.from(exerciseLogs)
			.where(
				and(
					...condition,
					eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.STRENGTH_TRAINING),
				),
			);

		const stretchingPromise = db
			.select(columns)
			.from(exerciseLogs)
			.where(
				and(
					...condition,
					eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.STRETCHING),
				),
			);

		promises.push(cardioPromise, strengthTrainingPromise, stretchingPromise);

		if (!sameDates) {
			for (const promise of promises) {
				promise.groupBy(...groupBy).orderBy(recordedAtCast);
			}
		}

		const [cardio, strengthTraining, stretching] = await Promise.all(promises);

		const cardioCaloriesBurnt = cardio.reduce(
			(acc, curr) => acc + curr.value,
			0,
		);
		const strengthTrainingCaloriesBurnt = strengthTraining.reduce(
			(acc, curr) => acc + curr.value,
			0,
		);
		const stretchingCaloriesBurnt = stretching.reduce(
			(acc, curr) => acc + curr.value,
			0,
		);

		const totalCaloriesBurnt =
			cardioCaloriesBurnt +
			strengthTrainingCaloriesBurnt +
			stretchingCaloriesBurnt;

		return {
			totals: {
				cardio: cardioCaloriesBurnt,
				strength_training: strengthTrainingCaloriesBurnt,
				stretching: stretchingCaloriesBurnt,
				total: totalCaloriesBurnt,
			},
			chartData: {
				cardio,
				strength_training: strengthTraining,
				stretching: stretching,
			},
		};
	}
}
