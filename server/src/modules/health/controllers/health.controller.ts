import { Response, NextFunction } from "express";
import { type AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { HealthService } from "../service/health.service";
import { BadRequestError } from "../../../shared/errors";
import { insertHealthMetricSchema } from "../models/health.schema";
import { UserService } from "../../user/service/user.service";
import { handleError } from "../../../shared/middleware/errorHandler";

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

      // Get user tier for limit checking
      const user = await this.userService.getProfile(userId);
      const userTier = user.tier || "free";

      const metric = await this.healthService.createMetric(
        validationResult.data,
        userTier
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
      const metric = await this.healthService.getLatestMetric(
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

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

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
}
