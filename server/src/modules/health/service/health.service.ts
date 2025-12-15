import { HealthRepository } from "../repository/health.repository";
import { SettingsService } from "../../settings/service/settings.service";
import type { InsertHealthMetric, HealthMetric, MertricRecord, InsertActivityLog, ActivityLog, InsertExerciseLog, ExerciseLog, InsertHealthMetricTarget, UpdateHealthMetricTarget, HealthMetricTarget } from "../models/health.schema";
import { BadRequestError } from "../../../shared/errors";
import { ExtendedLimits } from "../../settings/models/settings.schema";
import { ConsultationService } from "../../booking/service/consultation.service";

export class HealthService {
  private readonly healthRepository: HealthRepository;
  private readonly settingsService: SettingsService;
  private readonly consultationService: ConsultationService

  constructor() {
    this.healthRepository = new HealthRepository();
    this.settingsService = new SettingsService();
    this.consultationService = new ConsultationService()
  }

  async createMetric(data: InsertHealthMetric, paymentType: string = "free"): Promise<HealthMetric> {

    const userLimits = await this.getUserRemainingLimits(data.userId);
    const remainingLimits = userLimits.remainingLimits
    let key = ''

    if(data.bloodSugar) {
      key = 'glucoseLimit'
    } else if(data.steps) {
      key = 'stepsLimit'
    } else if(data.waterIntake) {
      key = 'waterLimit'
    } else if(data.heartRate) {
      key = 'heartRateLimits'
    }

    const metricValidationMap: Record<string, Function> = {

      glucoseLimit: async() =>{
        if(data.bloodSugar !== null && data.bloodSugar !== undefined && remainingLimits.glucoseLimit <= 0) {
          throw new BadRequestError("You have already reached the daily limit for blood sugar")
        }
      },
      stepsLimit: async () => {
        if (data.steps !== null && data.steps !== undefined) {
          if(remainingLimits.stepsLimit <= 0) {
            throw new BadRequestError("You have already reached the daily limit for steps")
          }
          const todaysStepsTotal = await this.healthRepository.getTodaysMetricTotal(data.userId, 'steps');
          const newTotal = todaysStepsTotal + data.steps;
          if (newTotal > 20000) {
            throw new BadRequestError(
              `Adding ${data.steps} steps would exceed the daily limit of 20,000 steps. Current total: ${Math.round(todaysStepsTotal)} steps.`
            );
          }
        }
      },
      waterLimit: async () =>{
        if (data.waterIntake !== null && data.waterIntake !== undefined) {
          if(userLimits.remainingLimits.waterLimit <= 0) {
            throw new BadRequestError("You have already reached the daily limit for water")
          }
          const todaysWaterTotal = await this.healthRepository.getTodaysMetricTotal(data.userId, 'water');
          const waterValue = parseFloat(data.waterIntake.toString());
          const newTotal = todaysWaterTotal + waterValue;
          if (newTotal > 4) {
            throw new BadRequestError(
              `Adding ${waterValue}L would exceed the daily limit of 4L. Current total: ${todaysWaterTotal.toFixed(2)}L.`
            );
          }
        }
      },
      heartRateLimits: async() => {}
    }

    const validationFunc = metricValidationMap[key]
    if(!validationFunc){
      throw new BadRequestError('Ivalid Metric Data Provided')
    }

    await validationFunc()


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

  async getLatestMetricsWithLimit(userId: string): Promise<{ 
    current: Partial<HealthMetric>,
    previous: Partial<HealthMetric>,
    limits: ExtendedLimits,
    remainingLimits: ExtendedLimits }> {
    const userLimits = await this.getUserRemainingLimits(userId);
    const latestMetrics = await this.healthRepository.getLatestMetric(userId);
    return {
      current: latestMetrics.current,
      previous: latestMetrics.previous,
      limits: userLimits.limits,
      remainingLimits: userLimits.remainingLimits,
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
    types: string[],
    limit?: number,
    offset?: number
  ): Promise<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
    pagination: {
      bloodSugar: { total: number; limit: number; offset: number };
      waterIntake: { total: number; limit: number; offset: number };
      steps: { total: number; limit: number; offset: number };
      heartBeat: { total: number; limit: number; offset: number };
    };
  }> {
    return await this.healthRepository.getFilteredMetrics(userId, startDate, endDate, types, limit, offset);
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

  async getStrengthProgress(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    logs: Array<{ date: string; total: number; pushups: number; squats: number; chinups: number; situps: number }>;
    percentageImprovement: number;
  }> {
    const logs = await this.healthRepository.getStrengthProgressLogs(userId, startDate, endDate);
    
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
      firstPeriodAvg = firstPeriod.reduce((sum, log) => sum + log.total, 0) / firstPeriod.length;
      
      // Last third average
      const lastPeriod = logs.slice(-thirdLength);
      lastPeriodAvg = lastPeriod.reduce((sum, log) => sum + log.total, 0) / lastPeriod.length;
    } else {
      // If we have fewer than 3 data points, compare first half with second half
      const midPoint = Math.floor(periodLength / 2);
      if (midPoint > 0) {
        const firstHalf = logs.slice(0, midPoint);
        const secondHalf = logs.slice(midPoint);
        firstPeriodAvg = firstHalf.reduce((sum, log) => sum + log.total, 0) / firstHalf.length;
        lastPeriodAvg = secondHalf.reduce((sum, log) => sum + log.total, 0) / secondHalf.length;
      } else {
        // Only one data point, no improvement to calculate
        return { logs, percentageImprovement: 0 };
      }
    }
    
    // Calculate percentage improvement
    let percentageImprovement = 0;
    if (firstPeriodAvg > 0) {
      percentageImprovement = Math.round(((lastPeriodAvg - firstPeriodAvg) / firstPeriodAvg) * 100);
    } else if (lastPeriodAvg > 0) {
      // If first period was 0, any improvement is 100%
      percentageImprovement = 100;
    }
    
    return { logs, percentageImprovement };
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

  async getUserRemainingLimits(userId: string) :Promise<{
    limits: Omit<ExtendedLimits, 'id' | "createdAt" | "updatedAt">,
    remainingLimits:Omit<ExtendedLimits, 'id' | "createdAt" | "updatedAt">
  }> {
    const limits = await this.settingsService.getFreeTierLimits()

    const bloodSugarLogsCount = await this.getTodaysMetricCount(userId, 'glucose')
    const stepsLogsCount = await this.getTodaysMetricCount(userId, 'steps')
    const waterLogsCount = await this.getTodaysMetricCount(userId, 'water')
    const consultationQuota = await this.consultationService.getUserConsultationQuota(userId)
    const foodScanLogsCount = await this.settingsService.getUserDailyScanCount(userId)

    const remainingBloodSugarLogs = limits.glucoseLimit - bloodSugarLogsCount
    const remainingStepsLogs = limits.stepsLimit - stepsLogsCount
    const remainingWaterLogs = limits.waterLimit - waterLogsCount
    const remainingFreeFoodScanLogs = limits.foodScanLimits?.freeTier || 0 - foodScanLogsCount
    const remainingPaidFoodScanLogs = limits.foodScanLimits?.paidTier || 0 - foodScanLogsCount
    const remainingDiscountedConsultations = limits.discountedConsultationQuota || 0 - (consultationQuota?.discountedConsultationsUsed || 0)
    const remainingFreeConsultations = limits.freeConsultationQuota || 0 - (consultationQuota?.freeConsultationsUsed || 0)

    return {
      limits,
      remainingLimits: {
        glucoseLimit: remainingBloodSugarLogs,
        stepsLimit: remainingStepsLogs,
        waterLimit: remainingWaterLogs,
        discountedConsultationQuota: remainingDiscountedConsultations,
        freeConsultationQuota: remainingFreeConsultations,
        foodScanLimits: {
          freeTier: remainingFreeFoodScanLogs,
          paidTier: remainingPaidFoodScanLogs,
        }
      } 
    }
  }
}

