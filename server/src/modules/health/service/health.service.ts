import {
	type ChartData,
	type HealthInsightsData,
	type HealthPagination,
	HealthRepository,
	FilteredMetricResponse,
} from "../repository/health.repository";
import { SettingsService } from "../../settings/service/settings.service";
import {
	type InsertHealthMetric,
	type HealthMetric,
	type MertricRecord,
	type InsertExerciseLog,
	type ExerciseLog,
	type InsertHealthMetricTarget,
	type HealthMetricTarget,
	type ExtendedHealthMetric,
	type MetricType,
	METRIC_TYPE_ENUM,
	type InsertDailyQuickLog,
	type DailyQuickLog,
} from "../models/health.schema";
import { BadRequestError } from "../../../shared/errors";
import type { ExtendedLimits } from "../../settings/models/settings.schema";
import { ConsultationService } from "../../booking/service/consultation.service";
import { CustomerService } from "../../customer/service/customer.service";
import { formatUserInfo } from "server/src/shared/utils/utils";
import { BLOOD_SUGAR_READING_TYPES_ENUM, type CustomerData } from "../../auth/models/user.schema";
import { aiService } from "../../../shared/services/ai.service";
import { UserService } from "../../user/service/user.service";

export class HealthService {
	private readonly healthRepository: HealthRepository;
	private readonly settingsService: SettingsService;
	private readonly consultationService: ConsultationService;
	private readonly customerService: CustomerService;
	private userService: UserService;

	constructor() {
		this.healthRepository = new HealthRepository();
		this.settingsService = new SettingsService();
		this.consultationService = new ConsultationService();
		this.customerService = new CustomerService();
		this.userService = new UserService();
	}

	async createMetric(
		data: InsertHealthMetric,
		userId: string,
	){
		const userLimits = await this.getUserRemainingLimits(
			data.userId,
			data.recordedAt,
		);
		const user = await this.userService.getProfile(userId);
		const paymentType = user.user.paymentType || "free";
		const remainingLimits = userLimits.remainingLimits;
		let key = "default";

		if (data.bloodSugar) {
			key = "glucoseLimit";
		} else if (data.heartRate) {
			key = "heartRateLimits";
		}

		const metricValidationMap: Record<string, Function> = {
			glucoseLimit: async () => {
				if (
					data.bloodSugar !== null &&
					data.bloodSugar !== undefined &&
					remainingLimits.glucoseLimit <= 0
				) {
					throw new BadRequestError(
						"You have already reached the daily limit for blood sugar",
					);
				}
			},
			heartRateLimits: async () => {
				if (
					data.heartRate !== null &&
					data.heartRate !== undefined &&
					data.heartRate < 0
				) {
					throw new BadRequestError("Heart rate value cannot be negative.");
				}

				if (data.heartRate && paymentType === "free") {
					throw new BadRequestError(
						"Heart rate tracking is only available for paid users. Please upgrade to access this feature.",
					);
				}
			},
			default: async () => {},
		};

		const validationFunc = metricValidationMap[key];
		if (!validationFunc) {
			throw new BadRequestError("Invalid Metric Data Provided");
		}

		await validationFunc();

		// Check daily limit for free tier users per metric type
		if (paymentType === "free") {
			// Determine which metric type is being logged
			let metricType: MetricType | null = null;

			if (data.bloodSugar) {
				metricType = METRIC_TYPE_ENUM.BLOOD_GLUCOSE;
			} 

			if (metricType) {
				const limit =
					await this.settingsService.getLimitForMetricType(metricType);
				const todayCount = await this.getTodaysMetricCount(
					data.userId,
					data.recordedAt,
					metricType,
				);

				if (todayCount >= limit) {
					const metricName =
						metricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE
							? "glucose"
							: "water intake";
					throw new BadRequestError(
						`Free tier users are limited to ${limit} ${metricName} log${limit !== 1 ? "s" : ""} per day. Please upgrade to paid plan for unlimited logging.`,
					);
				}
			}
		}

    if(data.bloodSugarReadingType === BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C) {
			const result =await this.createHba1cMetric(data.userId, {
				hba1c: data.bloodSugar!.toString(),
				recordedAt: data.recordedAt
			})
			return
		}

		await this.healthRepository.createMetricsBatch(data);
		return
	}

	async createMetricsBatch(
		data: InsertHealthMetric[],
	){
		return await this.healthRepository.createMetricsBatch(data)
	}

	async getLatestMetric(
		userId: string,
		date: string,
	): Promise<{
		current: Partial<ExtendedHealthMetric>;
		previous: Partial<ExtendedHealthMetric>;
	}> {
		return await this.healthRepository.getLatestMetric(userId, date);
	}

	async getLatestMetricsWithLimit(
		userId: string,
		startOfDay: string,
	): Promise<{
		current: Partial<HealthMetric>;
		previous: Partial<HealthMetric>;
		limits: ExtendedLimits;
		remainingLimits: ExtendedLimits;
		quickLog: {
			id: string;
			exercise: string | null;
			diet: string | null;
			sleepDuration: string | null;
			medicines: string | null;
			stressLevel: string | null;
			logDate: string;
		};
	}> {
		const userLimits = await this.getUserRemainingLimits(userId, startOfDay);
		const latestMetrics = await this.getLatestMetric(userId, startOfDay);
		const quickLog =
			await this.healthRepository.getDailyQuickLogForDate(userId, startOfDay);
		return {
			current: latestMetrics.current,
			previous: latestMetrics.previous,
			limits: userLimits.limits,
			remainingLimits: userLimits.remainingLimits,
			quickLog: quickLog
		};
	}

	async getTodaysMetricCount(
		userId: string,
		startOfDay: string,
		metricType?: MetricType,
	): Promise<number> {
		return await this.healthRepository.getTodaysMetricCount(
			userId,
			startOfDay,
			metricType,
		);
	}

	async getAggregatedStatistics(
		userId: string,
		date: string,
		total: boolean = false,
	): Promise<{
		glucose: { daily: number; weekly: number; monthly: number };
		steps: { daily: number; weekly: number; monthly: number };
		heartRate: { daily: number; weekly: number; monthly: number };
		targets: {
			recommended: HealthMetricTarget[];
			user: HealthMetricTarget[];
		};
	}> {
		const statistics = await this.healthRepository.getAggregatedStatistics(
			userId,
			total,
			date,
		);
		const targets = await this.getTargetsForUser(userId);

		return {
			...statistics,
			targets,
		};
	}

	async getFilteredMetrics(
		userId: string,
		startDate: string,
		endDate: string,
		types: MetricType[],
		limit?: number,
		offset?: number,
	): Promise<FilteredMetricResponse> {
		return await this.healthRepository.getFilteredMetrics(
			userId,
			startDate,
			endDate,
			types,
			limit,
			offset,
		);
	}

	async createExerciseLogsBatch(
		data: InsertExerciseLog[],
	): Promise<ExerciseLog[]> {
		// Validate steps if provided
		const logs: ExerciseLog[] = []
		const logMap = new Map<string, ExerciseLog[]>()
		for (const log of data) {
			if (log.steps !== null && log.steps !== undefined) {
				if (log.steps < 0) {
					throw new BadRequestError("Steps value cannot be negative.");
				}
				// Check daily limit for steps
				const todaysStepsTotal =
					await this.healthRepository.getTodaysMetricTotal(
						log.userId,
						METRIC_TYPE_ENUM.STEPS,
						log.recordedAt,
					);
				const newTotal = todaysStepsTotal + log.steps;
				if (newTotal > 20000) {
					throw new BadRequestError(
						`Adding ${log.steps} steps would exceed the daily limit of 20,000 steps. Current total: ${Math.round(todaysStepsTotal)} steps.`,
					);
				}
		    const logData = await this.healthRepository.createExerciseLogsBatch([log]);
				if(logData.length > 0){
					const stored = logMap.get(`${log.recordedAt}-${log.readingSource}`) || []
					stored.push(...logData)
					logMap.set(log.recordedAt, stored)
				}
			}
		}
		for(const [_, mappedLogs] of Array.from(logMap.entries())){
			if(mappedLogs.length === 0) continue
			logs.push(mappedLogs[mappedLogs.length - 1])
		}
		return logs
	}

	async getStrengthProgress(
		userId: string,
		startDate: Date,
		endDate: Date,
	): Promise<{
		logs: Array<{
			recordedAt: string;
			value: number;
			pushups: number;
			squats: number;
			chinups: number;
			situps: number;
		}>;
		percentageImprovement: number;
	}> {
		const logs = await this.healthRepository.getStrengthProgressLogs(
			userId,
			startDate,
			endDate,
		);

		if (logs.length === 0) {
			return { logs: [], percentageImprovement: 0 };
		}

		// Calculate percentage improvement
		// Compare first third of the period with last third
		const periodLength = logs.length;
		const thirdLength = Math.floor(periodLength / 3);

		let firstPeriodAvg = 0;
		let lastPeriodAvg = 0;

		if (thirdLength > 0) {
			// First third average
			const firstPeriod = logs.slice(0, thirdLength);
			firstPeriodAvg =
				firstPeriod.reduce((sum, log) => sum + log.value, 0) /
				firstPeriod.length;

			// Last third average
			const lastPeriod = logs.slice(-thirdLength);
			lastPeriodAvg =
				lastPeriod.reduce((sum, log) => sum + log.value, 0) / lastPeriod.length;
		} else {
			// If we have fewer than 3 data points, compare first half with second half
			const midPoint = Math.floor(periodLength / 2);
			if (midPoint > 0) {
				const firstHalf = logs.slice(0, midPoint);
				const secondHalf = logs.slice(midPoint);
				firstPeriodAvg =
					firstHalf.reduce((sum, log) => sum + log.value, 0) / firstHalf.length;
				lastPeriodAvg =
					secondHalf.reduce((sum, log) => sum + log.value, 0) /
					secondHalf.length;
			} else {
				// Only one data point, no improvement to calculate
				return { logs, percentageImprovement: 0 };
			}
		}

		// Calculate percentage improvement
		let percentageImprovement = 0;
		if (firstPeriodAvg > 0) {
			percentageImprovement = Math.round(
				((lastPeriodAvg - firstPeriodAvg) / firstPeriodAvg) * 100,
			);
		} else if (lastPeriodAvg > 0) {
			// If first period was 0, any improvement is 100%
			percentageImprovement = 100;
		}

		return { logs, percentageImprovement };
	}

	async createDailyQuickLog(
		userId: string,
		data: Omit<InsertDailyQuickLog, "userId">,
	): Promise<DailyQuickLog> {
		return await this.healthRepository.createDailyQuickLog({
			...data,
			userId,
		});
	}

	async createHba1cMetric(
		userId: string,
		data: { hba1c: string; recordedAt: string },
	) {
		return await this.healthRepository.createHba1cMetric({
			...data,
			userId,
			recordedAt: data.recordedAt,
		});
	}

	// Health Metric Targets Methods
	async getRecommendedTargets(): Promise<HealthMetricTarget[]> {
		return await this.healthRepository.getRecommendedTargets();
	}

	async getUserTargets(userId: string): Promise<HealthMetricTarget[]> {
		return await this.healthRepository.getUserTargets(userId);
	}

	async getTargetsForUser(userId: string): Promise<{
		recommended: HealthMetricTarget[];
		user: HealthMetricTarget[];
	}> {
		return await this.healthRepository.getTargetsForUser(userId);
	}

	async deleteUserTarget(
		userId: string,
		metricType: MetricType,
	): Promise<void> {
		return await this.healthRepository.deleteUserTarget(userId, metricType);
	}

	async upsertRecommendedTargetsBatch(
		targets: InsertHealthMetricTarget[],
	): Promise<HealthMetricTarget[]> {
		// Ensure all targets have userId set to null
		const validatedTargets = targets.map((t) => {
			if (t.userId) {
				throw new BadRequestError(
					"Recommended targets must have userId set to null",
				);
			}
			return { ...t, userId: null };
		});
		return await this.healthRepository.upsertTargetsBatch(validatedTargets);
	}

	async getUserRemainingLimits(
		userId: string,
		startOfDay: string,
	): Promise<{
		limits: Omit<ExtendedLimits, "id" | "createdAt" | "updatedAt">;
		remainingLimits: Omit<ExtendedLimits, "id" | "createdAt" | "updatedAt">;
	}> {
		const limits = await this.settingsService.getLogLimits();

		const bloodSugarLogsCount = await this.getTodaysMetricCount(
			userId,
			startOfDay,
			METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
		);
		const stepsLogsCount = await this.getTodaysMetricCount(
			userId,
			startOfDay,
			METRIC_TYPE_ENUM.STEPS,
		);

		const heartRateLogsCount = await this.getTodaysMetricCount(
			userId,
			startOfDay,
			METRIC_TYPE_ENUM.HEART_RATE,
		);
		const consultationQuota =
			await this.consultationService.getUserConsultationQuota(userId);
		const foodScanLogsCount =
			await this.settingsService.getUserDailyScanCount(userId);

		const remainingBloodSugarLogs = limits.glucoseLimit - bloodSugarLogsCount;
		const remainingStepsLogs = limits.stepsLimit - stepsLogsCount;
		const remainingFreeFoodScanLogs =
			limits.foodScanLimits?.freeTier || 0 - foodScanLogsCount;
		const remainingHeartRateLogs = limits.heartRateLimits - heartRateLogsCount
		const remainingPaidFoodScanLogs =
			limits.foodScanLimits?.paidTier || 0 - foodScanLogsCount;
		const remainingDiscountedConsultations =
			limits.discountedConsultationQuota ||
			0 - (consultationQuota?.discountedConsultationsUsed || 0);
		const remainingFreeConsultations =
			limits.freeConsultationQuota ||
			0 - (consultationQuota?.freeConsultationsUsed || 0);
		

		return {
			limits,
			remainingLimits: {
				glucoseLimit: remainingBloodSugarLogs,
				stepsLimit: remainingStepsLogs,
				heartRateLimits: remainingHeartRateLogs,
				discountedConsultationQuota: remainingDiscountedConsultations,
				freeConsultationQuota: remainingFreeConsultations,
				foodScanLimits: {
					freeTier: remainingFreeFoodScanLogs,
					paidTier: remainingPaidFoodScanLogs,
				},
			},
		};
	}

	async getHealthInsights(userId: string, date: string) {
		const healthInsights =
			await this.healthRepository.getHealthInsightsByUserId(userId, date);
		if (healthInsights) {
			return healthInsights;
		}

		// Get user data and statistics
		const [customerData, statistics] = await Promise.all([
			this.customerService.getCustomerDataByUserId(userId).catch(() => null),
			this.getAggregatedStatistics(userId, date, false),
		]);

		if (!customerData) {
			throw new BadRequestError(
				"Customer data not found. Please complete your profile first.",
			);
		}

		// Build AI service payload
		const aiPayload = {
			user_info: formatUserInfo(customerData as unknown as CustomerData),
			glucose_history: {
				daily: statistics.glucose.daily.toFixed(0),
				weekly: statistics.glucose.weekly.toFixed(0),
				monthly: statistics.glucose.monthly.toFixed(0),
				targets: {
					recommended_target:
						statistics.targets.recommended.find(
							(t) => t.metricType === "blood_glucose",
						)?.targetValue || "",
					user_target:
						statistics.targets.user.find(
							(t) => t.metricType === "blood_glucose",
						)?.targetValue || "",
				},
			},
			walking_steps_history: {
				daily: statistics.steps.daily.toFixed(0),
				weekly: statistics.steps.weekly.toFixed(0),
				monthly: statistics.steps.monthly.toFixed(0),
				targets: {
					recommended_target:
						statistics.targets.recommended.find((t) => t.metricType === "steps")
							?.targetValue || "",
					user_target:
						statistics.targets.user.find((t) => t.metricType === "steps")
							?.targetValue || "",
				},
			},
			heartRate_history: {
				daily: statistics.heartRate.daily.toFixed(0),
				weekly: statistics.heartRate.weekly.toFixed(0),
				monthly: statistics.heartRate.monthly.toFixed(0),
				targets: {
					recommended_target:
						statistics.targets.recommended.find(
							(t) => t.metricType === "heart_rate",
						)?.targetValue || "",
					user_target:
						statistics.targets.user.find((t) => t.metricType === "heart_rate")
							?.targetValue || "",
				},
			},
		};

		// Call AI service
		const response = await aiService.getHealthAssessmentInsights(aiPayload);

		const result = {
			insights: response.data.insights
				.map((i) => {
					let name: MetricType = "" as MetricType;
					if (i.name === "glucose") {
						name = METRIC_TYPE_ENUM.BLOOD_GLUCOSE;
					}
					else if (i.name === "steps") {
						name = METRIC_TYPE_ENUM.STEPS;
					} else if (i.name === "heart_rate") {
						name = METRIC_TYPE_ENUM.HEART_RATE;
					}

					return {
						name,
						insight: i.insight,
					};
				})
				.filter((i) => i !== undefined),
			overallHealthSummary: response.data.overall_health_summary,
			whatToDoNext: response.data.what_to_do_next,
		};

		// Store in database
		const healthInsightsResults =
			await this.healthRepository.createOrUpdateHealthInsights(
				userId,
				date,
				result,
			);

		return healthInsightsResults;
	}
	async upsertUserTargetsBatch(
		userId: string,
		targets: InsertHealthMetricTarget[],
	): Promise<HealthMetricTarget[]> {
		// Ensure all targets have matching userId
		const validatedTargets = targets.map((t) => {
			if (t.userId && t.userId !== userId) {
				throw new BadRequestError("User ID mismatch");
			}
			return { ...t, userId };
		});
		return await this.healthRepository.upsertTargetsBatch(validatedTargets);
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
		return await this.healthRepository.getCaloriesByActivityType(
			userId,
			startDate,
			endDate,
			sameDates,
		);
	}

	async analyzeGlucoseMeterImage(
		imageBuffer: Buffer,
		imageMimetype: string,
	): Promise<{ blood_sugar_reading: string }> {
		const response = await aiService.analyzeGlucoseMeterImage(
			imageBuffer,
			imageMimetype,
		);
		return response.data;
	}
}
