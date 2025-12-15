import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { HealthMetric, MertricRecord, ActivityLog, ExerciseLog } from '@shared/schema';
import type { ApiResponse } from '@/types/auth.types';
import { ExtendedLimits } from './settingsService';

class HealthService {

  async getLatestMetric(): Promise<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric>; limits: ExtendedLimits, remainingLimits: ExtendedLimits }> {
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

  async getChartMetrics(userId: string, days: number = 7): Promise<HealthMetric[]> {
    const response = await httpClient.get<ApiResponse<HealthMetric[]>>(
      `${API_ENDPOINTS.HEALTH.CHART}?userId=${userId}&days=${days}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch chart metrics');
    }
    return response.data;
  }

  async getMetrics(userId: string, limit: number = 30, offset: number = 0): Promise<HealthMetric[]> {
    const response = await httpClient.get<ApiResponse<HealthMetric[]>>(
      `${API_ENDPOINTS.HEALTH.METRICS}?userId=${userId}&limit=${limit}&offset=${offset}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch metrics');
    }
    return response.data;
  }

  async addMetric(data: any): Promise<HealthMetric> {
    const response = await httpClient.post<ApiResponse<HealthMetric>>(
      API_ENDPOINTS.HEALTH.ADD,
      {...data, recordedAt: new Date().toISOString()}
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add metric');
    }
    return response.data;
  }

  async getTodaysCount(metricType?: 'glucose' | 'steps' | 'water'): Promise<number> {
    const url = metricType
      ? `${API_ENDPOINTS.HEALTH.TODAY_COUNT}?metricType=${metricType}`
      : API_ENDPOINTS.HEALTH.TODAY_COUNT;
    
    const response = await httpClient.get<ApiResponse<{ count: number }>>(url);
    if (!response.success || response.data === undefined) {
      throw new Error(response.message || 'Failed to fetch today count');
    }
    return response.data.count;
  }

  async getTodaysCounts(): Promise<{ glucose: number; steps: number; water: number }> {
    const response = await httpClient.get<ApiResponse<{ glucose: number; steps: number; water: number }>>(
      API_ENDPOINTS.HEALTH.TODAY_COUNT
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch today counts');
    }
    return response.data;
  }

  async getAggregatedStatistics(): Promise<{
    glucose: { daily: number; weekly: number; monthly: number };
    water: { daily: number; weekly: number; monthly: number };
    steps: { daily: number; weekly: number; monthly: number };
    heartRate: { daily: number; weekly: number; monthly: number };
    targets: {
      recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
      user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
    };
  }> {
    const response = await httpClient.get<
      ApiResponse<{
        glucose: { daily: number; weekly: number; monthly: number };
        water: { daily: number; weekly: number; monthly: number };
        steps: { daily: number; weekly: number; monthly: number };
        heartRate: { daily: number; weekly: number; monthly: number };
        targets: {
          recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
          user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
        };
      }>
    >(API_ENDPOINTS.HEALTH.STATISTICS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch aggregated statistics');
    }
    return response.data;
  }

  async getFilteredMetrics(
    startDate: string,
    endDate: string,
    types: string[] = [],
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
  async addActivityLog(data: { activityType: 'walking' | 'yoga'; hours?: number; minutes?: number }): Promise<ActivityLog> {
    const response = await httpClient.post<ApiResponse<ActivityLog>>(
      API_ENDPOINTS.HEALTH.ACTIVITIES.ADD,
      {...data, recordedAt: new Date().toISOString()}
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to log activity');
    }
    return response.data;
  }

  async getActivityLogs(activityType?: 'walking' | 'yoga', limit: number = 30, offset: number = 0): Promise<ActivityLog[]> {
    const params = new URLSearchParams();
    if (activityType) params.append('activityType', activityType);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await httpClient.get<ApiResponse<ActivityLog[]>>(
      `${API_ENDPOINTS.HEALTH.ACTIVITIES.LIST}?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch activity logs');
    }
    return response.data;
  }

  async getTodayActivityLogs(activityType?: 'walking' | 'yoga'): Promise<ActivityLog[]> {
    const url = activityType
      ? `${API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY}?activityType=${activityType}`
      : API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY;
    
    const response = await httpClient.get<ApiResponse<ActivityLog[]>>(url);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch today activity logs');
    }
    return response.data;
  }

  async getTotalActivityMinutesToday(activityType?: 'walking' | 'yoga'): Promise<number> {
    const url = activityType
      ? `${API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY_TOTAL}?activityType=${activityType}`
      : API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY_TOTAL;
    
    const response = await httpClient.get<ApiResponse<{ totalMinutes: number }>>(url);
    if (!response.success || response.data === undefined) {
      throw new Error(response.message || 'Failed to fetch total activity minutes');
    }
    return response.data.totalMinutes;
  }

  async addExerciseLogsBatch(exercises: Array<{ exerciseType: 'pushups' | 'squats' | 'chinups' | 'situps'; count: number }>): Promise<ExerciseLog[]> {
    const response = await httpClient.post<ApiResponse<ExerciseLog[]>>(
      API_ENDPOINTS.HEALTH.EXERCISES.ADD_BATCH,
      { exercises: exercises.map(ex => ({ ...ex, recordedAt: new Date().toISOString()})) }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to log exercises');
    }
    return response.data;
  }

  async getExerciseLogs(exerciseType?: 'pushups' | 'squats' | 'chinups' | 'situps', limit: number = 30, offset: number = 0): Promise<ExerciseLog[]> {
    const params = new URLSearchParams();
    if (exerciseType) params.append('exerciseType', exerciseType);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await httpClient.get<ApiResponse<ExerciseLog[]>>(
      `${API_ENDPOINTS.HEALTH.EXERCISES.LIST}?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exercise logs');
    }
    return response.data;
  }

  async getTodayExerciseLogs(): Promise<ExerciseLog[]> {
    const response = await httpClient.get<ApiResponse<ExerciseLog[]>>(
      API_ENDPOINTS.HEALTH.EXERCISES.TODAY
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch today exercise logs');
    }
    return response.data;
  }

  async getTodayExerciseTotals(): Promise<{ pushups: number; squats: number; chinups: number; situps: number }> {
    const response = await httpClient.get<ApiResponse<{ pushups: number; squats: number; chinups: number; situps: number }>>(
      API_ENDPOINTS.HEALTH.EXERCISES.TODAY_TOTALS
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch today exercise totals');
    }
    return response.data;
  }

  async getStrengthProgress(startDate: string, endDate: string): Promise<{
    logs: Array<{ date: string; total: number; pushups: number; squats: number; chinups: number; situps: number }>;
    percentageImprovement: number;
  }> {
    const response = await httpClient.get<ApiResponse<{
      logs: Array<{ date: string; total: number; pushups: number; squats: number; chinups: number; situps: number }>;
      percentageImprovement: number;
    }>>(
      `${API_ENDPOINTS.HEALTH.EXERCISES.STRENGTH_PROGRESS}?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.success || response.data === undefined) {
      throw new Error(response.message || 'Failed to fetch strength progress');
    }
    return response.data;
  }

  // Health Metric Targets Methods
  async getRecommendedTargets(): Promise<Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>> {
    const response = await httpClient.get<ApiResponse<Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch recommended targets');
    }
    return response.data;
  }

  async getUserTargets(): Promise<Array<{ id: string; userId: string; metricType: string; targetValue: string }>> {
    const response = await httpClient.get<ApiResponse<Array<{ id: string; userId: string; metricType: string; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.USER
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user targets');
    }
    return response.data;
  }

  async getTargetsForUser(): Promise<{
    recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
    user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
  }> {
    const response = await httpClient.get<ApiResponse<{
      recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
      user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
    }>>(API_ENDPOINTS.HEALTH.TARGETS.BASE);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch targets');
    }
    return response.data;
  }

  async upsertRecommendedTarget(data: { metricType: string; targetValue: number }): Promise<{ id: string; userId: string | null; metricType: string; targetValue: string }> {
    const response = await httpClient.post<ApiResponse<{ id: string; userId: string | null; metricType: string; targetValue: string }>>(
      API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update recommended target');
    }
    return response.data;
  }

  async upsertUserTarget(data: { metricType: string; targetValue: number }): Promise<{ id: string; userId: string; metricType: string; targetValue: string }> {
    const response = await httpClient.post<ApiResponse<{ id: string; userId: string; metricType: string; targetValue: string }>>(
      API_ENDPOINTS.HEALTH.TARGETS.USER,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user target');
    }
    return response.data;
  }

  async deleteUserTarget(metricType: string): Promise<void> {
    const response = await httpClient.delete<ApiResponse<null>>(
      API_ENDPOINTS.HEALTH.TARGETS.DELETE_USER(metricType)
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user target');
    }
  }

  async upsertRecommendedTargetsBatch(targets: Array<{ metricType: string; targetValue: number }>): Promise<Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>> {
    const response = await httpClient.post<ApiResponse<Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED_BATCH,
      { targets }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update recommended targets');
    }
    return response.data;
  }

  async upsertUserTargetsBatch(targets: Array<{ metricType: string; targetValue: number }>): Promise<Array<{ id: string; userId: string; metricType: string; targetValue: string }>> {
    const response = await httpClient.post<ApiResponse<Array<{ id: string; userId: string; metricType: string; targetValue: string }>>>(
      API_ENDPOINTS.HEALTH.TARGETS.USER_BATCH,
      { targets }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user targets');
    }
    return response.data;
  }
}

export const healthService = new HealthService();

