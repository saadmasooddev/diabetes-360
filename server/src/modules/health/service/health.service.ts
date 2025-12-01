import { HealthRepository } from "../repository/health.repository";
import { SettingsService } from "../../settings/service/settings.service";
import type { InsertHealthMetric, HealthMetric, MertricRecord, InsertActivityLog, ActivityLog, InsertExerciseLog, ExerciseLog, InsertHealthMetricTarget, UpdateHealthMetricTarget, HealthMetricTarget } from "../models/health.schema";
import { BadRequestError } from "../../../shared/errors";
import { FreeTierLimits } from "../../settings/models/settings.schema";

export class HealthService {
  private healthRepository: HealthRepository;
  private settingsService: SettingsService;

  constructor() {
    this.healthRepository = new HealthRepository();
    this.settingsService = new SettingsService();
  }

  async createMetric(data: InsertHealthMetric, paymentType: string = "free"): Promise<HealthMetric> {
    // Heart rate is only available for paid users
    if (data.heartRate && paymentType === "free") {
      throw new BadRequestError("Heart rate tracking is only available for paid users. Please upgrade to access this feature.");
    }

    // Check daily limit for free tier users per metric type
    if (paymentType === "free") {
      // Determine which metric type is being logged
      let metricType: 'glucose' | 'steps' | 'water' | null = null;
      
      if (data.bloodSugar) {
        metricType = 'glucose';
      } else if (data.steps) {
        metricType = 'steps';
      } else if (data.waterIntake) {
        metricType = 'water';
      }

      if(!metricType){
        throw new BadRequestError("Invalid metric type");
      }

      const limit = await this.settingsService.getLimitForMetricType(metricType);
      const todayCount = await this.healthRepository.getTodaysMetricCount(data.userId, metricType);
      
      if (todayCount >= limit) {
        const metricName = metricType === 'glucose' ? 'glucose' : metricType === 'steps' ? 'steps' : 'water intake';
        throw new BadRequestError(
          `Free tier users are limited to ${limit} ${metricName} log${limit !== 1 ? 's' : ''} per day. Please upgrade to paid plan for unlimited logging.`
        );
      }
    }
    
    return await this.healthRepository.createMetric(data);
  }

  async getLatestMetric(userId: string): Promise<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric> }> {
    return await this.healthRepository.getLatestMetric(userId);
  }

  async getLatestMetricsWithLimit(userId: string): Promise<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric>, limits: FreeTierLimits }> {
    const limits = await this.settingsService.getFreeTierLimits();
    const latestMetrics = await this.healthRepository.getLatestMetric(userId);
    return {
      current: latestMetrics.current,
      previous: latestMetrics.previous,
      limits: limits,
    }
  }

  async getMetricsByUser(
    userId: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<HealthMetric[]> {
    return await this.healthRepository.getMetricsByUser(userId, limit, offset);
  }

  async getMetricsForChart(
    userId: string,
    days: number = 7
  ): Promise<HealthMetric[]> {
    return await this.healthRepository.getMetricsForChart(userId, days);
  }

  async getTodaysMetricCount(userId: string, metricType?: 'glucose' | 'steps' | 'water'): Promise<number> {
    return await this.healthRepository.getTodaysMetricCount(userId, metricType);
  }

  async getTodaysMetricCounts(userId: string): Promise<{ glucose: number; steps: number; water: number }> {
    const [glucose, steps, water] = await Promise.all([
      this.healthRepository.getTodaysMetricCount(userId, 'glucose'),
      this.healthRepository.getTodaysMetricCount(userId, 'steps'),
      this.healthRepository.getTodaysMetricCount(userId, 'water'),
    ]);

    return { glucose, steps, water };
  }

  async getAggregatedStatistics(userId: string): Promise<{
    glucose: { daily: number; weekly: number; monthly: number };
    water: { daily: number; weekly: number; monthly: number };
    steps: { daily: number; weekly: number; monthly: number };
    heartRate: { daily: number; weekly: number; monthly: number };
    targets: {
      recommended: HealthMetricTarget[];
      user: HealthMetricTarget[];
    };
  }> {
    const statistics = await this.healthRepository.getAggregatedStatistics(userId);
    const targets = await this.healthRepository.getTargetsForUser(userId);
    
    return {
      ...statistics,
      targets,
    };
  }

  async getFilteredMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
    types: string[]
  ): Promise<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
  }> {
    return await this.healthRepository.getFilteredMetrics(userId, startDate, endDate, types);
  }

  // Activity Logs Methods
  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    return await this.healthRepository.createActivityLog(data);
  }

  async getActivityLogs(
    userId: string,
    activityType?: "walking" | "yoga",
    limit: number = 30,
    offset: number = 0
  ): Promise<ActivityLog[]> {
    return await this.healthRepository.getActivityLogsByUser(userId, activityType, limit, offset);
  }

  async getTodayActivityLogs(userId: string, activityType?: "walking" | "yoga"): Promise<ActivityLog[]> {
    return await this.healthRepository.getTodayActivityLogs(userId, activityType);
  }

  async getActivityLogsForChart(
    userId: string,
    activityType: "walking" | "yoga",
    days: number = 7
  ): Promise<ActivityLog[]> {
    return await this.healthRepository.getActivityLogsForChart(userId, activityType, days);
  }

  async getTotalActivityMinutesToday(userId: string, activityType?: "walking" | "yoga"): Promise<number> {
    return await this.healthRepository.getTotalActivityMinutesToday(userId, activityType);
  }


  async createExerciseLogsBatch(data: InsertExerciseLog[]): Promise<ExerciseLog[]> {
    return await this.healthRepository.createExerciseLogsBatch(data);
  }

  async getExerciseLogs(
    userId: string,
    exerciseType?: "pushups" | "squats" | "chinups" | "situps",
    limit: number = 30,
    offset: number = 0
  ): Promise<ExerciseLog[]> {
    return await this.healthRepository.getExerciseLogsByUser(userId, exerciseType, limit, offset);
  }

  async getTodayExerciseLogs(userId: string): Promise<ExerciseLog[]> {
    return await this.healthRepository.getTodayExerciseLogs(userId);
  }

  async getTodayExerciseTotals(userId: string): Promise<{
    pushups: number;
    squats: number;
    chinups: number;
    situps: number;
  }> {
    return await this.healthRepository.getTodayExerciseTotals(userId);
  }

  async getExerciseLogsForChart(
    userId: string,
    exerciseType: "pushups" | "squats" | "chinups" | "situps",
    days: number = 7
  ): Promise<ExerciseLog[]> {
    return await this.healthRepository.getExerciseLogsForChart(userId, exerciseType, days);
  }

  async getStrengthProgressPercentage(userId: string, days: number = 30): Promise<number> {
    return await this.healthRepository.getStrengthProgressPercentage(userId, days);
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

  async upsertRecommendedTarget(data: InsertHealthMetricTarget): Promise<HealthMetricTarget> {
    // Ensure userId is null for recommended targets
    if (data.userId) {
      throw new BadRequestError("Recommended targets must have userId set to null");
    }
    return await this.healthRepository.upsertTarget({ ...data, userId: null });
  }

  async upsertUserTarget(userId: string, data: InsertHealthMetricTarget): Promise<HealthMetricTarget> {
    // Ensure userId matches
    if (data.userId && data.userId !== userId) {
      throw new BadRequestError("User ID mismatch");
    }
    return await this.healthRepository.upsertTarget({ ...data, userId });
  }

  async deleteUserTarget(userId: string, metricType: "glucose" | "steps" | "water_intake" | "heart_rate"): Promise<void> {
    return await this.healthRepository.deleteUserTarget(userId, metricType);
  }

  async upsertRecommendedTargetsBatch(targets: InsertHealthMetricTarget[]): Promise<HealthMetricTarget[]> {
    // Ensure all targets have userId set to null
    const validatedTargets = targets.map(t => {
      if (t.userId) {
        throw new BadRequestError("Recommended targets must have userId set to null");
      }
      return { ...t, userId: null };
    });
    return await this.healthRepository.upsertTargetsBatch(validatedTargets);
  }

  async upsertUserTargetsBatch(userId: string, targets: InsertHealthMetricTarget[]): Promise<HealthMetricTarget[]> {
    // Ensure all targets have matching userId
    const validatedTargets = targets.map(t => {
      if (t.userId && t.userId !== userId) {
        throw new BadRequestError("User ID mismatch");
      }
      return { ...t, userId };
    });
    return await this.healthRepository.upsertTargetsBatch(validatedTargets);
  }
}

