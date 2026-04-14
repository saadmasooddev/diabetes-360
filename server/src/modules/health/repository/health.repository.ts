import { db } from "../../../app/config/db";
import {
	healthMetrics,
	exerciseLogs,
	healthMetricTargets,
	healthInsights,
	metricTypes,
	METRIC_TYPE_ENUM,
	ACTIVITY_TYPE_ENUM,
	hba1cMetrics,
	dailyQuickLogs,
	QUICK_LOG_EXERCISE_TYPE_ENUM,
	HEALTH_METRIC_SOURCE_ENUM,
} from "../models/health.schema";
import {
	eq,
	ne,
	desc,
	asc,
	and,
	gte,
	lte,
	sql,
	isNotNull,
	isNull,
	max,
} from "drizzle-orm";
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
	InsertHba1cMetric,
	InsertDailyQuickLog,
	DailyQuickLog,
	BloodSugarMetricRecord,
} from "../models/health.schema";
import type { PgTable } from "drizzle-orm/pg-core";
import { BadRequestError } from "server/src/shared/errors";
import type { LoggedMeal, Tx } from "../../food/models/food.schema";
import {
	BLOOD_SUGAR_READING_TYPES_ENUM,
	USER_ROLES,
	users,
} from "../../auth/models/user.schema";
import { FoodRepository } from "../../food/repository/food.repository";
import {
	DateManager,
	PUSH_MESSAGE_TYPE_ENUM,
	userPushNotifications,
} from "@shared/schema";
import { PushNotificationService } from "../../notifications/services/push-notification.service";

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

export type FilteredMetricResponse = {
	bloodSugarRecords: BloodSugarMetricRecord[];
	waterIntakeRecords: MertricRecord[];
	stepsRecords: MertricRecord[];
	heartBeatRecords: MertricRecord[];
	calorieIntakeRecords: MertricRecord[];
	meals: LoggedMeal[];
	pagination: {
		bloodSugar: HealthPagination;
		waterIntake: HealthPagination;
		steps: HealthPagination;
		heartBeat: HealthPagination;
		calorieIntake: HealthPagination;
	};
};

export class HealthRepository {
	private readonly INACTIVITY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

	private readonly foodRepository: FoodRepository;
	private readonly pushNotificationService = new PushNotificationService();

	constructor() {
		this.foodRepository = new FoodRepository();
	}

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
		if (metricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE) {
			conditions.push(isNotNull(healthMetrics.bloodSugar));
		} else if (metricType === METRIC_TYPE_ENUM.STEPS) {
			table = exerciseLogs;
			conditions = [
				eq(exerciseLogs.userId, userId),
				sql`DATE(${exerciseLogs.recordedAt}) between DATE(${startOfDay}) and DATE(${startOfDay})`,
				isNotNull(exerciseLogs.steps),
			];
		} else if (metricType === METRIC_TYPE_ENUM.HEART_RATE) {
			conditions.push(isNotNull(healthMetrics.heartRate));
		}

		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(table)
			.where(and(...conditions));

		return result[0]?.count || 0;
	}

	async createMetricsBatch(
		data: InsertHealthMetric | InsertHealthMetric[],
		tx?: Tx,
	): Promise<HealthMetric[]> {
		const dbConn = db || tx;
		const values = Array.isArray(data) ? data : [data];
		const valuesToInsert = values.map((data) => ({
			userId: data.userId,
			bloodSugar: data.bloodSugar?.toString() || null,
			bloodSugarReadingType: data.bloodSugarReadingType,
			heartRate: data.heartRate || null,
			recordedAt: new Date(data.recordedAt),
			readingSource: data.readingSource || HEALTH_METRIC_SOURCE_ENUM.CUSTOM,
		}));
		if (valuesToInsert.length === 0) return [];
		const metrics = await dbConn
			.insert(healthMetrics)
			.values(valuesToInsert)
			.returning()
			.onConflictDoUpdate({
				target: [healthMetrics.recordedAt, healthMetrics.readingSource],
				set: {
					heartRate: sql.raw(`excluded.${healthMetrics.heartRate.name}`),
					bloodSugar: sql.raw(`excluded.${healthMetrics.bloodSugar.name}`),
					bloodSugarReadingType: sql.raw(
						`excluded.${healthMetrics.bloodSugarReadingType.name}`,
					),
					userId: sql.raw(`excluded.${healthMetrics.userId.name}`),
				},
			});

		return metrics;
	}

	async createHba1cMetric(data: InsertHba1cMetric, tx?: Tx) {
		const dbConn = db || tx;
		return await dbConn
			.insert(hba1cMetrics)
			.values({
				userId: data.userId,
				hba1c: data.hba1c,
				recordedAt: new Date(data.recordedAt),
			})
			.returning();
	}

	async getTodaysMetricTotal(
		userId: string,
		metricType: MetricType,
		date: string,
	): Promise<number> {
		// Steps are stored in exercise_logs

		const metricTypeMap: Record<MetricType, () => Promise<number>> = {
			[METRIC_TYPE_ENUM.STEPS]: async () => {
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
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: async () => {
				return 0;
			},
			[METRIC_TYPE_ENUM.HEART_RATE]: async () => {
				return 0;
			},
			[METRIC_TYPE_ENUM.CALORIE_INTAKE]: async () => {
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
		const bloodSugarBaseConditions = and(
			eq(healthMetrics.userId, userId),
			isNotNull(healthMetrics.bloodSugar),
		);

		const latestNormalSugarPromise = db
			.select()
			.from(healthMetrics)
			.where(
				and(
					bloodSugarBaseConditions,
					eq(
						healthMetrics.bloodSugarReadingType,
						BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
					),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(2);

		const latestFastingSugarPromise = db
			.select({ bloodSugar: healthMetrics.bloodSugar })
			.from(healthMetrics)
			.where(
				and(
					bloodSugarBaseConditions,
					eq(
						healthMetrics.bloodSugarReadingType,
						BLOOD_SUGAR_READING_TYPES_ENUM.FASTING,
					),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(1);

		const latestRandomSugarPromise = db
			.select({ bloodSugar: healthMetrics.bloodSugar })
			.from(healthMetrics)
			.where(
				and(
					bloodSugarBaseConditions,
					eq(
						healthMetrics.bloodSugarReadingType,
						BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM,
					),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(1);

		// Get today's totals for steps and water instead of latest values
		const todaysStepsTotalPromise = this.getTodaysMetricTotal(
			userId,
			METRIC_TYPE_ENUM.STEPS,
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

		const latestHba1cPromise = db
			.select({ hba1c: hba1cMetrics.hba1c })
			.from(hba1cMetrics)
			.where(eq(hba1cMetrics.userId, userId))
			.orderBy(desc(hba1cMetrics.recordedAt))
			.limit(1);

		const [
			latestNormalSugar,
			latestFastingSugar,
			latestRandomSugar,
			todaysStepsTotal,
			previousSteps,
			latestHeartRate,
			latestHba1c,
		] = await Promise.all([
			latestNormalSugarPromise,
			latestFastingSugarPromise,
			latestRandomSugarPromise,
			todaysStepsTotalPromise,
			previousStepsPromise,
			latestHeartRatePromise,
			latestHba1cPromise,
		]);

		const previousStepsTotal = parseFloat(
			previousSteps[0]?.total?.toString() || "0",
		);
		const exerciseSetsPromise = this.getTodaysExerciseSetsCount(userId, date);

		const exerciseSets = await exerciseSetsPromise;

		return {
			current: {
				bloodSugar: latestNormalSugar[0]?.bloodSugar || null,
				fastingSugar: latestFastingSugar[0]?.bloodSugar?.toString() ?? "0",
				randomSugar: latestRandomSugar[0]?.bloodSugar?.toString() ?? "0",
				heartRate: latestHeartRate[0]?.heartRate || null,
				steps: Math.round(todaysStepsTotal),
				exerciseSets,
				hba1c: latestHba1c[0]?.hba1c?.toString() ?? null,
			},
			previous: {
				bloodSugar: latestNormalSugar[1]?.bloodSugar || null,
				fastingSugar: latestFastingSugar[1]?.bloodSugar?.toString() ?? "0",
				randomSugar: latestFastingSugar[1]?.bloodSugar?.toString() ?? "0",
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
			dailySteps,
			dailyHeartRate,
			weeklyGlucose,
			weeklySteps,
			weeklyHeartRate,
			monthlyGlucose,
			monthlySteps,
			monthlyHeartRate,
		] = await Promise.all([
			dailyGlucosePromise,
			dailyStepsPromise,
			dailyHeartRatePromise,
			weeklyGlucosePromise,
			weeklyStepsPromise,
			weeklyHeartRatePromise,
			monthlyGlucosePromise,
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

			const [totalGlucose, totalSteps, totalHeartRate] = await Promise.all([
				totalGlucosePromise,
				totalStepsPromise,
				totalHeartRatePromise,
			]);
			result.glucose.total = Number(totalGlucose[0]?.total);
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
	): Promise<FilteredMetricResponse> {
		const baseConditions = [
			eq(healthMetrics.userId, userId),
			sql`DATE(${healthMetrics.recordedAt}) between DATE(${startDate}) and DATE(${endDate})`,
		];

		const result: FilteredMetricResponse = {
			bloodSugarRecords: [] as BloodSugarMetricRecord[],
			waterIntakeRecords: [] as MertricRecord[],
			stepsRecords: [] as MertricRecord[],
			heartBeatRecords: [] as MertricRecord[],
			calorieIntakeRecords: [] as MertricRecord[],
			meals: [] as LoggedMeal[],
			pagination: {
				bloodSugar: { total: 0, limit: limit || 0, offset: offset || 0 },
				waterIntake: { total: 0, limit: limit || 0, offset: offset || 0 },
				steps: { total: 0, limit: limit || 0, offset: offset || 0 },
				heartBeat: { total: 0, limit: limit || 0, offset: offset || 0 },
				calorieIntake: { total: 0, limit: limit || 0, offset: offset || 0 },
			},
		};

		// If no types specified, return all types
		const requestedTypes = types.length > 0 ? types : metricTypes;

		// Fetch blood sugar records
		const metricTypeMap: Record<MetricType, () => Promise<void>> = {
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: async () => {
				// const d = () => new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 365) + 1))
				// await db.insert(healthMetrics).values(
				// 	Array(1000).fill(0).map(() => ({
				// 		userId: userId,
				//     bloodSugar: String(Math.floor(Math.random() * 600) + 70),
				// 		waterIntake: String(Math.floor(Math.random() * 5) + 1),
				// 		heartRate: Math.floor(Math.random() * 220) + 60,
				// 		recordedAt: d(),

				// 	}))
				// )
				const bloodSugarQueryPromise = db
					.select({
						id: healthMetrics.id,
						userId: healthMetrics.userId,
						value: healthMetrics.bloodSugar,
						recordedAt: healthMetrics.recordedAt,
						readingType: healthMetrics.bloodSugarReadingType,
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
				if (limit !== undefined && offset !== undefined) {
					bloodSugarQueryPromise.limit(limit).offset(offset);
				}

				result.bloodSugarRecords =
					(await bloodSugarQueryPromise) as BloodSugarMetricRecord[];
			},
			[METRIC_TYPE_ENUM.STEPS]: async () => {
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
			[METRIC_TYPE_ENUM.HEART_RATE]: async () => {
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
			[METRIC_TYPE_ENUM.CALORIE_INTAKE]: async () => {
				const calorieIntakeRecords =
					await this.foodRepository.getCaloriesIngestedPerDayBetweenDates(
						userId,
						startDate,
						endDate,
					);

				const { meals, total } =
					await this.foodRepository.getMealsLoggedBetweenDates(
						userId,
						startDate,
						endDate,
						limit,
						offset,
					);

				result.meals = meals;
				result.pagination.calorieIntake.total = total;
				result.calorieIntakeRecords = calorieIntakeRecords;
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
					readingSource: d.readingSource || HEALTH_METRIC_SOURCE_ENUM.CUSTOM,
				})),
			)
			.onConflictDoUpdate({
				target: [exerciseLogs.recordedAt, exerciseLogs.readingSource],
				set: {
					exerciseType: sql.raw(`excluded.${exerciseLogs.exerciseType.name}`),
					exerciseName: sql.raw(`excluded.${exerciseLogs.exerciseName.name}`),
					calories: sql.raw(`excluded.${exerciseLogs.calories.name}`),
					activityType: sql.raw(`excluded.${exerciseLogs.activityType.name}`),
					pace: sql.raw(`excluded.${exerciseLogs.pace.name}`),
					sets: sql.raw(`excluded.${exerciseLogs.sets.name}`),
					weight: sql.raw(`excluded.${exerciseLogs.weight.name}`),
					steps: sql.raw(`excluded.${exerciseLogs.steps.name}`),
					muscle: sql.raw(`excluded.${exerciseLogs.muscle.name}`),
					duration: sql.raw(`excluded.${exerciseLogs.duration.name}`),
					repitition: sql.raw(`excluded.${exerciseLogs.repitition.name}`),
					userId: sql.raw(`excluded.${exerciseLogs.userId.name}`),
				},
			})
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

	async getDailyQuickLogForDate(
		userId: string,
		dateStr: string,
	): Promise<DailyQuickLog> {
		const dateOnly = dateStr;
		const [log] = await db
			.select()
			.from(dailyQuickLogs)
			.where(
				and(
					eq(dailyQuickLogs.userId, userId),
					eq(dailyQuickLogs.logDate, dateOnly),
				),
			)
			.limit(1);
		return {
			id: log?.id,
			userId: log?.userId,
			diet: log?.diet,
			exercise: log?.exercise,
			sleepDuration: log?.sleepDuration,
			medicines: log?.medicines,
			stressLevel: log?.stressLevel,
			logDate: log?.logDate,
			recordedAt: log?.recordedAt,
		};
	}

	async createOrUpdateDailyQuickLog(
		data: InsertDailyQuickLog & { logDate?: string },
	): Promise<DailyQuickLog> {
		const targetDate = data.logDate ? new Date(data.logDate) : new Date();
		const logDateStr = targetDate.toISOString().split("T")[0];
		const now = new Date();

		const [log] = await db
			.insert(dailyQuickLogs)
			.values({
				userId: data.userId,
				logDate: logDateStr,
				exercise: data.exercise,
				diet: data.diet,
				sleepDuration: data.sleepDuration,
				medicines: data.medicines,
				stressLevel: data.stressLevel,
				recordedAt: data.recordedAt ? new Date(data.recordedAt) : now,
			})
			.onConflictDoUpdate({
				target: [dailyQuickLogs.userId, dailyQuickLogs.logDate],
				set: {
					exercise: data.exercise,
					diet: data.diet,
					sleepDuration: data.sleepDuration,
					medicines: data.medicines,
					stressLevel: data.stressLevel,
					recordedAt: data.recordedAt ? new Date(data.recordedAt) : now,
				},
			})
			.returning();
		return log;
	}

	async createDailyQuickLog(data: InsertDailyQuickLog): Promise<DailyQuickLog> {
		return this.createOrUpdateDailyQuickLog(data);
	}

	async getTodaysExerciseSetsCount(
		userId: string,
		date: string,
	): Promise<number> {
		const dateOnly = date.split("T")[0];
		const result = await db
			.select({
				count: sql<number>`count(*)::int`,
			})
			.from(dailyQuickLogs)
			.where(
				and(
					eq(dailyQuickLogs.userId, userId),
					eq(dailyQuickLogs.logDate, dateOnly),
					ne(dailyQuickLogs.exercise, QUICK_LOG_EXERCISE_TYPE_ENUM.NONE),
					isNotNull(dailyQuickLogs.exercise),
				),
			);
		return result[0]?.count ?? 0;
	}

	async getHba1cTrend(
		userId: string,
		startDate: string,
		endDate: string,
	): Promise<Array<{ value: number; recordedAt: Date }>> {
		const rows = await db
			.select({
				hba1c: hba1cMetrics.hba1c,
				recordedAt: hba1cMetrics.recordedAt,
			})
			.from(hba1cMetrics)
			.where(
				and(
					eq(hba1cMetrics.userId, userId),
					sql`DATE(${hba1cMetrics.recordedAt}) >= DATE(${startDate})`,
					sql`DATE(${hba1cMetrics.recordedAt}) <= DATE(${endDate})`,
				),
			)
			.orderBy(asc(hba1cMetrics.recordedAt));
		return rows.map((r) => ({
			value: parseFloat(r.hba1c?.toString() || "0"),
			recordedAt: r.recordedAt,
		}));
	}

	async getQuickLogsForDateRange(
		userId: string,
		startDate: string,
		endDate: string,
	): Promise<
		Array<{
			logDate: string;
			exercise: string | null;
			sleepDuration: string | null;
		}>
	> {
		const rows = await db
			.select({
				logDate: dailyQuickLogs.logDate,
				exercise: dailyQuickLogs.exercise,
				sleepDuration: dailyQuickLogs.sleepDuration,
			})
			.from(dailyQuickLogs)
			.where(
				and(
					eq(dailyQuickLogs.userId, userId),
					gte(dailyQuickLogs.logDate, startDate.split("T")[0]),
					lte(dailyQuickLogs.logDate, endDate.split("T")[0]),
				),
			)
			.orderBy(asc(dailyQuickLogs.logDate));
		return rows.map((r) => ({
			logDate: String(r.logDate),
			exercise: r.exercise,
			sleepDuration: r.sleepDuration,
		}));
	}

	async getLatestBloodGlucose(userId: string): Promise<number | null> {
		const [row] = await db
			.select({ bloodSugar: healthMetrics.bloodSugar })
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					eq(
						healthMetrics.bloodSugarReadingType,
						BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
					),
					isNotNull(healthMetrics.bloodSugar),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(1);
		return row?.bloodSugar ? parseFloat(row.bloodSugar.toString()) : null;
	}

	async getLatestBloodGlucoseForAlerts(userId: string): Promise<number | null> {
		const [row] = await db
			.select({ bloodSugar: healthMetrics.bloodSugar })
			.from(healthMetrics)
			.where(
				and(
					eq(healthMetrics.userId, userId),
					ne(
						healthMetrics.bloodSugarReadingType,
						BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C,
					),
					isNotNull(healthMetrics.bloodSugar),
				),
			)
			.orderBy(desc(healthMetrics.recordedAt))
			.limit(1);
		return row?.bloodSugar ? parseFloat(row.bloodSugar.toString()) : null;
	}

	async getLastActivityAt(userId: string): Promise<Date | null> {
		const [ex] = await db
			.select({ m: max(exerciseLogs.recordedAt) })
			.from(exerciseLogs)
			.where(eq(exerciseLogs.userId, userId));
		const [hm] = await db
			.select({ m: max(healthMetrics.recordedAt) })
			.from(healthMetrics)
			.where(eq(healthMetrics.userId, userId));
		const [dq] = await db
			.select({ m: max(dailyQuickLogs.recordedAt) })
			.from(dailyQuickLogs)
			.where(eq(dailyQuickLogs.userId, userId));

		const times = [
			DateManager.date(ex?.m),
			DateManager.date(hm?.m),
			DateManager.date(dq?.m),
		].filter((d): d is Date => d != null);

		if (times.length === 0) return null;
		return new Date(Math.max(...times.map((d) => d.getTime())));
	}

	async runInactivityNotificationJob(): Promise<void> {
		const sinceCooldown = new Date(Date.now() - this.INACTIVITY_COOLDOWN_MS);
		const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

		const customerIds = await db
			.select({ id: users.id })
			.from(users)
			.where(
				and(eq(users.role, USER_ROLES.CUSTOMER), eq(users.isActive, true)),
			);

		for (const { id: userId } of customerIds) {
			const lastAt = await this.getLastActivityAt(userId);
			if (lastAt !== null && lastAt >= cutoff) {
				continue;
			}

			const [recent] = await db
				.select({ id: userPushNotifications.id })
				.from(userPushNotifications)
				.where(
					and(
						eq(userPushNotifications.userId, userId),
						eq(
							userPushNotifications.messageType,
							PUSH_MESSAGE_TYPE_ENUM.INACTIVITY_ALERT,
						),
						gte(userPushNotifications.createdAt, sinceCooldown),
					),
				)
				.orderBy(desc(userPushNotifications.createdAt))
				.limit(1);
			if (recent) continue;

			const lastIso = lastAt ? lastAt.toISOString() : null;

			try {
				await this.pushNotificationService.sendDataOnlyToUser(userId, {
					type: PUSH_MESSAGE_TYPE_ENUM.INACTIVITY_ALERT,
					title: "We miss you",
					body: "You have not logged any activity in the last day. A quick check-in helps you stay on track.",
					data: { lastActivityAtIso: lastIso },
				});
			} catch (e) {
				console.error(
					`[InactivityNotificationJob] Failed for user ${userId}:`,
					e,
				);
			}
		}
	}
}
