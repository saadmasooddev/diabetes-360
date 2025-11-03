import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { FreeTierLimits } from '@shared/schema';
import type { ApiResponse } from '@/types/auth.types';

class SettingsService {
  async getFreeTierLimits(): Promise<FreeTierLimits> {
    const response = await httpClient.get<ApiResponse<FreeTierLimits>>(API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch free tier limits');
    }
    return response.data;
  }

  async createFreeTierLimits(data: { glucoseLimit: number; stepsLimit: number; waterLimit: number }): Promise<FreeTierLimits> {
    const response = await httpClient.post<ApiResponse<FreeTierLimits>>(
      API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create free tier limits');
    }
    return response.data;
  }

  async updateFreeTierLimits(data: Partial<{ glucoseLimit: number; stepsLimit: number; waterLimit: number }>): Promise<FreeTierLimits> {
    const response = await httpClient.put<ApiResponse<FreeTierLimits>>(
      API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update free tier limits');
    }
    return response.data;
  }
}

export const settingsService = new SettingsService();

