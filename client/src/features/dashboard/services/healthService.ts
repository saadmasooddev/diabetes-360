import { API_ENDPOINTS } from '@/config/endpoints';
import { apiRequest } from '@/lib/queryClient';
import type { HealthMetric, InsertHealthMetric } from '@shared/schema';

export const healthService = {
  getLatestMetrics: async (userId: string): Promise<HealthMetric | null> => {
    const response = await fetch(`${API_ENDPOINTS.HEALTH.LATEST}?userId=${userId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch latest metrics');
    }
    return response.json();
  },

  getMetrics: async (userId: string, limit: number = 10): Promise<HealthMetric[]> => {
    const response = await fetch(`${API_ENDPOINTS.HEALTH.METRICS}?userId=${userId}&limit=${limit}`);
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
