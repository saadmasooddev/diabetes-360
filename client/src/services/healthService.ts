import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { HealthMetric, MertricRecord, ExerciseLog, ExtendedHealthMetric, MetricType, ActivityType, InsertHealthMetric } from '@shared/schema';
import type { ApiResponse } from '@/types/auth.types';
import { ExtendedLimits } from './settingsService';
import { ChartData } from 'server/src/modules/health/repository/health.repository';

export type Statistics = {
  daily: number; weekly: number; monthly: number

}

export type Target = {
 id: string; userId: string | null;metricType: MetricType; targetValue: string 
}

export type AggregatedStatistics = {
  glucose: Statistics;
  water:  Statistics;
  steps:   Statistics;
  heartRate: Statistics;
  targets: {
    recommended: Array<Target>;
    user: Array<Target>;
  };
}

export interface HealthInsights {
  insights: Array<HealthInsight>;
  overallHealthSummary: string;
  whatToDoNext: Array<HealthTips>;
}
export interface HealthInsight { 
name: MetricType; insight: string
}

export interface InsertExerciseLog {

    exerciseType: string;
    calories: number;
    activityType: ActivityType 
    duration: number; // in seconds
    steps?: number;
    pace?: string;
  
}

export interface HealthTips {
name: string; tip: string
}
class HealthService {

  async getLatestMetric(): Promise<{ current: Partial<ExtendedHealthMetric>; previous: Partial<ExtendedHealthMetric>; limits: ExtendedLimits, remainingLimits: ExtendedLimits }> {
    const response = await httpClient.get<ApiResponse<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric>;  limits: ExtendedLimits, remainingLimits : ExtendedLimits  }>>(
      `${API_ENDPOINTS.HEALTH.LATEST}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch latest metric');
    }
    return response.data || { current: {}, previous: {}, limits : {
      glucoseLimit: 0,
      stepsLimit: 0,
      waterLimit: 0,
      discountedConsultationQuota: 0,
      freeConsultationQuota: 0,
      foodScanLimits: {
        freeTier: 0,
        paidTier: 0,
      },
      paidUserScanLimit: 0,
      id: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }  as ExtendedLimits, 
      remainingLimits : {
        glucoseLimit: 0,
        stepsLimit: 0,
        waterLimit: 0,
        discountedConsultationQuota: 0,
        freeConsultationQuota: 0,
        foodScanLimits: {
          freeTier: 0,
          paidTier: 0,
        },
        id: '',
        createdAt: new Date(),
        updatedAt: new Date()
    } };
  }





  async getAggregatedStatistics(): Promise<AggregatedStatistics> {
    const response = await httpClient.get<
      ApiResponse<AggregatedStatistics>
    >(API_ENDPOINTS.HEALTH.STATISTICS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch aggregated statistics');
    }
    return response.data;
  }

  async getFilteredMetrics(
    startDate: string,
    endDate: string,
    types: MetricType[] = [],
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
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    // Add types as multiple query parameters
    types.forEach(type => {
      params.append('type', type);
    });

    // Add pagination parameters if provided
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }
    if (offset !== undefined) {
      params.append('offset', offset.toString());
    }

    const response = await httpClient.get<
      ApiResponse<{
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
      }>
    >(`${API_ENDPOINTS.HEALTH.FILTERED}?${params.toString()}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch filtered metrics');
    }
    return response.data;
  }

  // Activity Logs Methods
  async addActivityLog(data: { activityType: 'walking' | 'yoga'; hours?: number; minutes?: number }): Promise<ExerciseLog> {
    const response = await httpClient.post<ApiResponse<ExerciseLog>>(
      API_ENDPOINTS.HEALTH.ACTIVITIES.ADD,
      {...data, recordedAt: new Date().toISOString()}
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to log activity');
    }
    return response.data;
  }




  async addActivityLogsBatch({exercises, healthMetrics}: {exercises: Array<InsertExerciseLog>, healthMetrics?: InsertHealthMetric}): Promise<ExerciseLog[]> {
    const response = await httpClient.post<ApiResponse<ExerciseLog[]>>(
      API_ENDPOINTS.HEALTH.EXERCISES.ADD_BATCH,
      { 
        exercises: exercises.map(ex => ({ 
          ...ex, 
          duration: ex.duration.toString(), 
          recordedAt: new Date().toISOString()
        })),
        healthMetrics: healthMetrics
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to log activities');
    }
    return response.data;
  }




  // Health Metric Targets Methods
  async getRecommendedTargets(): Promise<Array<{ id: string; userId: string | null; metricType: MetricType; targetValue: string }>> {
    const response = await httpClient.get<ApiResponse<Array<{ id: string; userId: string | null; metricType: MetricType; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch recommended targets');
    }
    return response.data;
  }


  async getTargetsForUser(): Promise<{
    recommended: Array<{ id: string; userId: string | null;metricType: MetricType; targetValue: string }>;
    user: Array<{ id: string; userId: string;metricType: MetricType; targetValue: string }>;
  }> {
    const response = await httpClient.get<ApiResponse<{
      recommended: Array<{ id: string; userId: string | null;metricType: MetricType; targetValue: string }>;
      user: Array<{ id: string; userId: string;metricType: MetricType; targetValue: string }>;
    }>>(API_ENDPOINTS.HEALTH.TARGETS.BASE);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch targets');
    }
    return response.data;
  }



  async deleteUserTarget(metricType: MetricType): Promise<void> {
    const response = await httpClient.delete<ApiResponse<null>>(
      API_ENDPOINTS.HEALTH.TARGETS.DELETE_USER(metricType)
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user target');
    }
  }


  async upsertUserTargetsBatch(targets: Array<{metricType: MetricType; targetValue: number }>): Promise<Array<{ id: string; userId: string;metricType: MetricType; targetValue: string }>> {
    const response = await httpClient.post<ApiResponse<Array<{ id: string; userId: string;metricType: MetricType; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.USER_BATCH,
      { targets }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user targets');
    }
    return response.data;
  }

  async getHealthInsights(): Promise<HealthInsights> {
    const response = await httpClient.get<ApiResponse<HealthInsights>>(API_ENDPOINTS.HEALTH.INSIGHTS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch health insights');
    }
    return response.data;
  }

  async upsertRecommendedTargetsBatch(targets: Array<{metricType: MetricType; targetValue: number }>): Promise<Array<{ id: string; userId: string | null;metricType: MetricType; targetValue: string }>> {
    const response = await httpClient.post<ApiResponse<Array<{ id: string; userId: string | null;metricType: MetricType; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED_BATCH,
      { targets }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update recommended targets');
    }
    return response.data;
  }

  async getCaloriesByActivityType(startDate: string, endDate: string): Promise<{
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
    const response = await httpClient.get<ApiResponse<{
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
    }>>(
      `${API_ENDPOINTS.HEALTH.EXERCISES.CALORIES_BY_ACTIVITY}?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch calories data');
    }
    return response.data;
  }
}


export const healthService = new HealthService();

