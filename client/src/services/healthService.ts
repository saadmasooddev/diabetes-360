import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { HealthMetric } from '@shared/schema';
import type { ApiResponse } from '@/types/auth.types';

class HealthService {
  async getLatestMetric(userId: string): Promise<HealthMetric | null> {
    const response = await httpClient.get<ApiResponse<HealthMetric | null>>(
      `${API_ENDPOINTS.HEALTH.LATEST}?userId=${userId}`
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch latest metric');
    }
    return response.data ?? null;
  }

  async getChartMetrics(userId: string, days: number = 7): Promise<HealthMetric[]> {
    const response = await httpClient.get<ApiResponse<HealthMetric[]>>(
      `${API_ENDPOINTS.HEALTH.CHART}?userId=${userId}&days=${days}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch chart metrics');
    }
    return response.data;
  }

  async getMetrics(userId: string, limit: number = 30, offset: number = 0): Promise<HealthMetric[]> {
    const response = await httpClient.get<ApiResponse<HealthMetric[]>>(
      `${API_ENDPOINTS.HEALTH.METRICS}?userId=${userId}&limit=${limit}&offset=${offset}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch metrics');
    }
    return response.data;
  }

  async addMetric(data: any): Promise<HealthMetric> {
    const response = await httpClient.post<ApiResponse<HealthMetric>>(
      API_ENDPOINTS.HEALTH.ADD,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add metric');
    }
    return response.data;
  }

  async getTodaysCount(metricType?: 'glucose' | 'steps' | 'water'): Promise<number> {
    const url = metricType
      ? `${API_ENDPOINTS.HEALTH.TODAY_COUNT}?metricType=${metricType}`
      : API_ENDPOINTS.HEALTH.TODAY_COUNT;
    
    const response = await httpClient.get<ApiResponse<{ count: number }>>(url);
    if (!response.success || response.data === undefined) {
      throw new Error(response.error || 'Failed to fetch today count');
    }
    return response.data.count;
  }

  async getTodaysCounts(): Promise<{ glucose: number; steps: number; water: number }> {
    const response = await httpClient.get<ApiResponse<{ glucose: number; steps: number; water: number }>>(
      API_ENDPOINTS.HEALTH.TODAY_COUNT
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch today counts');
    }
    return response.data;
  }
}

export const healthService = new HealthService();

