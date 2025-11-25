import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { HealthService } from "../service/health.service";
import { BadRequestError } from "../../../shared/errors";
import { insertHealthMetricSchema, insertActivityLogSchema, insertExerciseLogSchema, insertHealthMetricTargetSchema, batchUpsertHealthMetricTargetsSchema } from "../models/health.schema";
import { UserService } from "../../user/service/user.service";
import { handleError } from "../../../shared/middleware/errorHandler";
import { parseLocalDate } from "server/src/shared/utils/utils";

export class HealthController {
  private healthService: HealthService;
  private userService: UserService;

  constructor() {
    this.healthService = new HealthService();
    this.userService = new UserService();
  }

  async addMetric(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const validationResult = insertHealthMetricSchema.safeParse({
        ...req.body,
        userId: userId,
      });

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid metric data"
        );
      }

      // Get user payment type for limit checking
      const user = await this.userService.getProfile(userId);
      const paymentType = user.paymentType || "free";

      const metric = await this.healthService.createMetric(
        validationResult.data,
        paymentType
      );
      sendSuccess(res, metric, "Metric logged successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getLatestMetric(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metric = await this.healthService.getLatestMetricsWithLimit(
        req.user?.userId || ""
      );
      sendSuccess(res, metric, "Latest metric retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;

      const metrics = await this.healthService.getMetricsByUser(
        userId,
        limit,
        offset
      );
      sendSuccess(res, metrics, "Metrics retrieved successfully");
    } catch (error: any) {
      handleError(res, error, { metrics: [] });
    }
  }

  async getChartData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const days = parseInt(req.query.days as string) || 7;

      const metrics = await this.healthService.getMetricsForChart(userId, days);
      sendSuccess(res, metrics, "Chart data retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTodaysCount(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const metricType = req.query.metricType as
        | "glucose"
        | "steps"
        | "water"
        | undefined;

      if (metricType) {
        const count = await this.healthService.getTodaysMetricCount(
          userId,
          metricType
        );
        sendSuccess(
          res,
          { count },
          "Today's metric count retrieved successfully"
        );
      } else {
        const counts = await this.healthService.getTodaysMetricCounts(userId);
        sendSuccess(
          res,
          counts,
          "Today's metric counts retrieved successfully"
        );
      }
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAggregatedStatistics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const statistics = await this.healthService.getAggregatedStatistics(
        userId
      );
      sendSuccess(
        res,
        statistics,
        "Aggregated statistics retrieved successfully"
      );
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getFilteredMetrics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId || "";

      // Parse query parameters
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;
      const typesParam = req.query.type;

      if (!startDateStr || !endDateStr) {
        throw new BadRequestError("startDate and endDate are required");
      }


      const startDate = parseLocalDate(startDateStr);
      const endDate = parseLocalDate(endDateStr);

      // Set to start and end of day in local timezone
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestError(
          "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)"
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
      const validTypes = ["blood_sugar", "water_intake", "steps", "heart_beat"];
      const invalidTypes = types.filter((t) => !validTypes.includes(t));
      if (invalidTypes.length > 0) {
        throw new BadRequestError(
          `Invalid metric types: ${invalidTypes.join(
            ", "
          )}. Valid types are: ${validTypes.join(", ")}`
        );
      }

      const result = await this.healthService.getFilteredMetrics(
        userId,
        startDate,
        endDate,
        types
      );
      sendSuccess(res, result, "Filtered metrics retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Activity Logs Controllers
  async addActivityLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const { activityType, hours = 0, minutes = 0 } = req.body;

      // Validate activity type
      if (!activityType || !['walking', 'yoga'].includes(activityType)) {
        throw new BadRequestError("activityType must be 'walking' or 'yoga'");
      }

      // Convert hours and minutes to total minutes
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
      
      if (totalMinutes <= 0) {
        throw new BadRequestError("Total duration must be greater than 0 minutes");
      }

      // Validate the complete data
      const validationResult = insertActivityLogSchema.safeParse({
        userId,
        activityType,
        durationMinutes: totalMinutes,
      });

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid activity log data"
        );
      }
      
      const log = await this.healthService.createActivityLog(validationResult.data);
      
      sendSuccess(res, log, "Activity logged successfully");
    } catch (error: any) {
      console.log(error)
      handleError(res, error);
    }
  }

  async getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const activityType = req.query.activityType as "walking" | "yoga" | undefined;
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await this.healthService.getActivityLogs(
        userId,
        activityType,
        limit,
        offset
      );
      sendSuccess(res, logs, "Activity logs retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTodayActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const activityType = req.query.activityType as "walking" | "yoga" | undefined;

      const logs = await this.healthService.getTodayActivityLogs(userId, activityType);
      sendSuccess(res, logs, "Today's activity logs retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTotalActivityMinutesToday(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const activityType = req.query.activityType as "walking" | "yoga" | undefined;

      const totalMinutes = await this.healthService.getTotalActivityMinutesToday(userId, activityType);
      sendSuccess(res, { totalMinutes }, "Total activity minutes retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Exercise Logs Controllers
  async addExerciseLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const validationResult = insertExerciseLogSchema.safeParse({
        ...req.body,
        userId: userId,
      });

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid exercise log data"
        );
      }

      const log = await this.healthService.createExerciseLog(validationResult.data);
      sendSuccess(res, log, "Exercise logged successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async addExerciseLogsBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const { exercises } = req.body; // Array of { exerciseType, count }

      if (!Array.isArray(exercises) || exercises.length === 0) {
        throw new BadRequestError("Exercises array is required and must not be empty");
      }

      const logsToInsert = exercises
        .filter(ex => ex.count && parseInt(ex.count) > 0)
        .map(ex => ({
          userId,
          exerciseType: ex.exerciseType,
          count: parseInt(ex.count),
        }));

      if (logsToInsert.length === 0) {
        throw new BadRequestError("At least one exercise with count > 0 is required");
      }

      // Validate each exercise log
      for (const log of logsToInsert) {
        const validationResult = insertExerciseLogSchema.safeParse(log);
        if (!validationResult.success) {
          throw new BadRequestError(
            validationResult.error.message || "Invalid exercise log data"
          );
        }
      }

      const logs = await this.healthService.createExerciseLogsBatch(logsToInsert);
      sendSuccess(res, logs, "Exercises logged successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getExerciseLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const exerciseType = req.query.exerciseType as "pushups" | "squats" | "chinups" | "situps" | undefined;
      const limit = parseInt(req.query.limit as string) || 30;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await this.healthService.getExerciseLogs(
        userId,
        exerciseType,
        limit,
        offset
      );
      sendSuccess(res, logs, "Exercise logs retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTodayExerciseLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";

      const logs = await this.healthService.getTodayExerciseLogs(userId);
      sendSuccess(res, logs, "Today's exercise logs retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTodayExerciseTotals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";

      const totals = await this.healthService.getTodayExerciseTotals(userId);
      sendSuccess(res, totals, "Today's exercise totals retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getStrengthProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const days = parseInt(req.query.days as string) || 30;

      const percentage = await this.healthService.getStrengthProgressPercentage(userId, days);
      sendSuccess(res, { percentage }, "Strength progress retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  // Health Metric Targets Controllers
  async getRecommendedTargets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targets = await this.healthService.getRecommendedTargets();
      sendSuccess(res, targets, "Recommended targets retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getUserTargets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const targets = await this.healthService.getUserTargets(userId);
      sendSuccess(res, targets, "User targets retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getTargetsForUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const targets = await this.healthService.getTargetsForUser(userId);
      sendSuccess(res, targets, "Targets retrieved successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async upsertRecommendedTarget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validationResult = insertHealthMetricTargetSchema.safeParse({
        ...req.body,
        userId: null, // Admin targets have null userId
      });

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid target data"
        );
      }

      const target = await this.healthService.upsertRecommendedTarget(validationResult.data);
      sendSuccess(res, target, "Recommended target updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async upsertUserTarget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const validationResult = insertHealthMetricTargetSchema.safeParse({
        ...req.body,
        userId: userId,
      });

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid target data"
        );
      }

      const target = await this.healthService.upsertUserTarget(userId, validationResult.data);
      sendSuccess(res, target, "User target updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async deleteUserTarget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const metricType = req.params.metricType as "glucose" | "steps" | "water_intake" | "heart_rate";

      if (!["glucose", "steps", "water_intake", "heart_rate"].includes(metricType)) {
        throw new BadRequestError("Invalid metric type");
      }

      await this.healthService.deleteUserTarget(userId, metricType);
      sendSuccess(res, null, "User target deleted successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async upsertRecommendedTargetsBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validationResult = batchUpsertHealthMetricTargetsSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid target data"
        );
      }

      // Ensure all targets have userId set to null
      const targets = validationResult.data.targets.map(t => ({ ...t, userId: null }));

      const results = await this.healthService.upsertRecommendedTargetsBatch(targets);
      sendSuccess(res, results, "Recommended targets updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async upsertUserTargetsBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || "";
      const validationResult = batchUpsertHealthMetricTargetsSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new BadRequestError(
          validationResult.error.message || "Invalid target data"
        );
      }

      // Ensure all targets have matching userId
      const targets = validationResult.data.targets.map(t => ({ ...t, userId }));

      const results = await this.healthService.upsertUserTargetsBatch(userId, targets);
      sendSuccess(res, results, "User targets updated successfully");
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
