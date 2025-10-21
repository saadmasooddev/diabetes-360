import { API_ENDPOINTS } from '@/config/endpoints';
import { apiRequest } from '@/lib/queryClient';
import type { HealthMetric, InsertHealthMetric } from '@shared/schema';

export const healthService = {
  getLatestMetrics: async (): Promise<HealthMetric | null> => {
    const response = await fetch(API_ENDPOINTS.HEALTH.LATEST);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch latest metrics');
    }
    return response.json();
  },

  getMetrics: async (limit: number = 10): Promise<HealthMetric[]> => {
    const response = await fetch(`${API_ENDPOINTS.HEALTH.METRICS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return response.json();
  },

  addMetric: async (data: InsertHealthMetric): Promise<HealthMetric> => {
    const response = await apiRequest('POST', API_ENDPOINTS.HEALTH.ADD, data);
    return response.json();
  },
};
