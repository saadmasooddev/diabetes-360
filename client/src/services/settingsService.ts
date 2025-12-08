import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { FreeTierLimits } from '@shared/schema';
import type { ApiResponse } from '@/types/auth.types';

export interface FoodScanLimits {
  id: string;
  freeUserLimit: number;
  paidUserLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodScanStatus {
  canScan: boolean;
  currentCount: number;
  limit: number;
}

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

  // Food Scan Limits Methods
  async getFoodScanLimits(): Promise<FoodScanLimits> {
    const response = await httpClient.get<ApiResponse<FoodScanLimits>>(API_ENDPOINTS.SETTINGS.FOOD_SCAN_LIMITS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch food scan limits');
    }
    return response.data;
  }

  async createFoodScanLimits(data: { freeUserLimit: number; paidUserLimit: number }): Promise<FoodScanLimits> {
    const response = await httpClient.post<ApiResponse<FoodScanLimits>>(
      API_ENDPOINTS.SETTINGS.FOOD_SCAN_LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create food scan limits');
    }
    return response.data;
  }

  async updateFoodScanLimits(data: Partial<{ freeUserLimit: number; paidUserLimit: number }>): Promise<FoodScanLimits> {
    const response = await httpClient.put<ApiResponse<FoodScanLimits>>(
      API_ENDPOINTS.SETTINGS.FOOD_SCAN_LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update food scan limits');
    }
    return response.data;
  }

  async getFoodScanStatus(): Promise<FoodScanStatus> {
    const response = await httpClient.get<ApiResponse<FoodScanStatus>>(API_ENDPOINTS.SETTINGS.FOOD_SCAN_STATUS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch food scan status');
    }
    return response.data;
  }
}

export const settingsService = new SettingsService();

