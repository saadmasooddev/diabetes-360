import { HealthRepository } from "../repository/health.repository";
import { SettingsService } from "../../settings/service/settings.service";
import type { InsertHealthMetric, HealthMetric, MertricRecord } from "../models/health.schema";
import { BadRequestError } from "../../../shared/errors";

export class HealthService {
  private healthRepository: HealthRepository;
  private settingsService: SettingsService;

  constructor() {
    this.healthRepository = new HealthRepository();
    this.settingsService = new SettingsService();
  }

  async createMetric(data: InsertHealthMetric, userTier: string = "free"): Promise<HealthMetric> {
    // Heart rate is only available for paid users
    if (data.heartRate && userTier !== "paid") {
      throw new BadRequestError("Heart rate tracking is only available for paid users. Please upgrade to access this feature.");
    }

    // Check daily limit for free tier users per metric type
    if (userTier === "free") {
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

  async getLatestMetric(userId: string): Promise<HealthMetric | null> {
    return await this.healthRepository.getLatestMetric(userId);
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
  }> {
    return await this.healthRepository.getAggregatedStatistics(userId);
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
}

