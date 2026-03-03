import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { HealthService } from "../service/health.service";
import { BadRequestError, ValidationError } from "../../../shared/errors";
import {
	insertHealthMetricSchema,
	insertExerciseLogSchema,
	insertDailyQuickLogSchema,
	insertHba1cMetricSchema,
	batchUpsertHealthMetricTargetsSchema,
	metricTypes,
	type MetricType,
	type InsertExerciseLog,
} from "../models/health.schema";
import { handleError } from "../../../shared/middleware/errorHandler";
import {
	DateManager,
	validateLimitAndOffset,
} from "server/src/shared/utils/utils";
import { ZodError } from "zod";

export class HealthController {
	private healthService: HealthService;

	constructor() {
		this.healthService = new HealthService();
	}

	async getLatestMetric(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const date = req.query.date as string;
			if (isNaN(new Date(date).getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const metric = await this.healthService.getLatestMetricsWithLimit(
				req.user?.userId || "",
				date,
			);
			sendSuccess(res, metric, "Latest metric retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getAggregatedStatistics(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const total = req.query.total === "true";
			const date = req.query.date as string;
			if (isNaN(new Date(date).getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const statistics = await this.healthService.getAggregatedStatistics(
				userId,
				date,
				total,
			);
			sendSuccess(
				res,
				statistics,
				"Aggregated statistics retrieved successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getFilteredMetrics(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";

			// Parse query parameters
			const startDateStr = req.query.startDate as string;
			const endDateStr = req.query.endDate as string;
			const typesParam = req.query.type;
			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: undefined;
			const offset = req.query.offset
				? parseInt(req.query.offset as string)
				: undefined;

			if (!startDateStr || !endDateStr) {
				throw new BadRequestError("startDate and endDate are required");
			}

			validateLimitAndOffset(limit, offset);
			// Validate pagination parameters

			const startDate = DateManager.parseLocalDate(startDateStr);
			const endDate = DateManager.parseLocalDate(endDateStr);

			// Set to start and end of day in local timezone
			startDate.setHours(0, 0, 0, 0);
			endDate.setHours(23, 59, 59, 999);

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				throw new BadRequestError(
					"Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
				);
			}

			// Parse types array
			let types: string[] = [];
			if (typesParam) {
				try {
					const parsedTypes: string[] = JSON.parse(typesParam as string);
					types = parsedTypes;
				} catch (error) {
					types = [typesParam as string];
				}
			}

			// Validate types
			const invalidTypes = types.filter(
				(t) => !metricTypes.includes(t as MetricType),
			);
			if (invalidTypes.length > 0) {
				throw new BadRequestError(
					`Invalid metric types: ${invalidTypes.join(
						", ",
					)}. Valid types are: ${metricTypes.join(", ")}`,
				);
			}

			const result = await this.healthService.getFilteredMetrics(
				userId,
				startDateStr,
				endDateStr,
				types as MetricType[],
				limit,
				offset,
			);
			sendSuccess(res, result, "Filtered metrics retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async addExerciseLogsBatch(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const { exercises } = req.body; // Array of exercise log objects
			const healthMetrics = req.body.healthMetrics;

			if (!Array.isArray(exercises)) {
				throw new BadRequestError(
					"Exercises array is required and must not be empty",
				);
			}

			let date: string = "";

			if (healthMetrics && typeof healthMetrics === "object") {
				const validatedHealthMetricData = this.validateHealthMetric({
					...healthMetrics,
					userId,
				});
				await this.healthService.createMetric(
					validatedHealthMetricData,
					userId,
				);
				date = validatedHealthMetricData.recordedAt;
			}

			const logsToInsert = exercises.map((ex) => ({
				userId,
				...ex,
			}));

			const parsedData: InsertExerciseLog[] = [];
			// Validate each exercise log
			for (const log of logsToInsert) {
				const validationResult = insertExerciseLogSchema.safeParse(log);
				if (!validationResult.success) {
				  throw new ValidationError(undefined, validationResult.error)
				}

				if (
					validationResult.data.recordedAt &&
					isNaN(new Date(validationResult.data.recordedAt).getTime())
				)
					throw new BadRequestError("Invalid date format");
				parsedData.push(validationResult.data);
			}

			date = date || parsedData[0]?.recordedAt;
			if (!date) {
				throw new BadRequestError("No valid exercises to log");
			}
			const logs = await this.healthService.createExerciseLogsBatch(parsedData);
			const latestMetrics = await this.healthService.getLatestMetricsWithLimit(
				userId,
				date,
			);
			sendSuccess(
				res,
				{ logs, latestMetrics },
				"Exercises logged successfully",
			);
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getStrengthProgress(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const startDateStr = req.query.startDate as string;
			const endDateStr = req.query.endDate as string;

			if (!startDateStr || !endDateStr) {
				throw new BadRequestError(
					"startDate and endDate query parameters are required",
				);
			}

			const startDate = new Date(startDateStr);
			const endDate = new Date(endDateStr);

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				throw new BadRequestError(
					"Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
				);
			}

			if (startDate > endDate) {
				throw new BadRequestError(
					"startDate must be before or equal to endDate",
				);
			}

			// Set time to end of day for endDate to include the full day
			endDate.setHours(23, 59, 59, 999);
			startDate.setHours(0, 0, 0, 0);

			const result = await this.healthService.getStrengthProgress(
				userId,
				startDate,
				endDate,
			);
			sendSuccess(res, result, "Strength progress retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	// Health Metric Targets Controllers
	async getRecommendedTargets(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const targets = await this.healthService.getRecommendedTargets();
			sendSuccess(res, targets, "Recommended targets retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getUserTargets(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const targets = await this.healthService.getUserTargets(userId);
			sendSuccess(res, targets, "User targets retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getTargetsForUser(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const targets = await this.healthService.getTargetsForUser(userId);
			sendSuccess(res, targets, "Targets retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async deleteUserTarget(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const metricType = req.params.metricType as MetricType;

			if (
				!["glucose", "steps", "water_intake", "heart_rate"].includes(metricType)
			) {
				throw new BadRequestError("Invalid metric type");
			}

			await this.healthService.deleteUserTarget(userId, metricType);
			sendSuccess(res, null, "User target deleted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async upsertRecommendedTargetsBatch(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const validationResult = batchUpsertHealthMetricTargetsSchema.safeParse(
				req.body,
			);

			if (!validationResult.success) {
				throw validationResult.error;
			}

			// Ensure all targets have userId set to null
			const targets = validationResult.data.targets.map((t) => ({
				...t,
				userId: null,
			}));

			const results =
				await this.healthService.upsertRecommendedTargetsBatch(targets);
			sendSuccess(res, results, "Recommended targets updated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async upsertUserTargetsBatch(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const validationResult = batchUpsertHealthMetricTargetsSchema.safeParse(
				req.body,
			);

			if (!validationResult.success) {
				throw validationResult.error;
			}

			// Ensure all targets have matching userId
			const targets = validationResult.data.targets.map((t) => ({
				...t,
				userId,
			}));

			const results = await this.healthService.upsertUserTargetsBatch(
				userId,
				targets,
			);
			sendSuccess(res, results, "User targets updated successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async getHealthInsights(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			if (!userId) {
				throw new BadRequestError("User ID not found");
			}

			const date = req.query.date as string;
			if (isNaN(new Date(date).getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const insights = await this.healthService.getHealthInsights(userId, date);
			sendSuccess(res, insights, "Health insights retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async createDailyQuickLog(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const validation = insertDailyQuickLogSchema
				.omit({ userId: true })
				.safeParse(req.body);
			if (!validation.success) {
				throw new ValidationError(undefined, validation.error);
			}
			
			const { data } = validation
		  if (!data.exercise && !data.diet && !data.sleepDuration && !data.medicines && !data.stressLevel) {
				throw new BadRequestError("At least one field must be filled");
			}
			if(!data.logDate || isNaN(new Date(data.logDate).getTime())) {
				throw new BadRequestError("Invalid date format");
			}
			const log = await this.healthService.createDailyQuickLog(userId, {
				...data,
				recordedAt: data.recordedAt ?? new Date().toISOString(),
			});
			sendSuccess(res, log, "Daily quick log created successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}


	private validateHealthMetric(data: object) {
		const validationResult = insertHealthMetricSchema.safeParse(data);

		if (!validationResult.success) {
			throw new ValidationError(undefined, validationResult.error);
		}

		if (
			validationResult.data.recordedAt &&
			isNaN(new Date(validationResult.data.recordedAt).getTime())
		)
			throw new BadRequestError("Invalid date format");

		return validationResult.data;
	}

	async getCaloriesByActivityType(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId || "";
			const startDateStr = req.query.startDate as string;
			const endDateStr = req.query.endDate as string;

			if (!startDateStr || !endDateStr) {
				throw new BadRequestError(
					"startDate and endDate query parameters are required",
				);
			}

			const startDate = DateManager.parseLocalDate(startDateStr);
			const endDate = DateManager.parseLocalDate(endDateStr);

			if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
				throw new BadRequestError(
					"Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
				);
			}

			if (startDate > endDate) {
				throw new BadRequestError(
					"startDate must be before or equal to endDate",
				);
			}

			startDate.setHours(0, 0, 0, 0);
			endDate.setHours(23, 59, 59, 999);

			const sameDates =
				DateManager.formatDate(startDateStr) ===
				DateManager.formatDate(endDateStr);
			const result = await this.healthService.getCaloriesByActivityType(
				userId,
				startDate,
				endDate,
				sameDates,
			);
			sendSuccess(res, result, "Calories data retrieved successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}

	async uploadGlucoseMeterImage(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			if (!req.file) {
				throw new BadRequestError("Image file is required");
			}

			const imageBuffer = req.file.buffer;
			const imageMimetype = req.file.mimetype;

			if (!imageBuffer) {
				throw new BadRequestError("Failed to process image");
			}

			const result = await this.healthService.analyzeGlucoseMeterImage(
				imageBuffer,
				imageMimetype,
			);
			sendSuccess(res, result, "Glucose reading extracted successfully");
		} catch (error: any) {
			handleError(res, error);
		}
	}
}
