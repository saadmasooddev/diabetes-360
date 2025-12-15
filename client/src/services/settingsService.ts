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

export type ExtendedLimits = FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }

class SettingsService {
  // Unified limits endpoint - returns both health metrics and food scan limits
  async getLimits(): Promise<FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }> {
    const response = await httpClient.get<ApiResponse<ExtendedLimits>>(API_ENDPOINTS.SETTINGS.LIMITS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch limits');
    }
    return response.data;
  }

  async createLimits(data: Partial<{ 
    glucoseLimit: number; 
    stepsLimit: number; 
    waterLimit: number;
    discountedConsultationQuota: number;
    freeConsultationQuota: number;
    freeUserScanLimit: number;
    paidUserScanLimit: number;
  }>): Promise<FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }> {
    const response = await httpClient.post<ApiResponse<FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }>>(
      API_ENDPOINTS.SETTINGS.LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create limits');
    }
    return response.data;
  }

  async updateLimits(data: Partial<{ 
    glucoseLimit: number; 
    stepsLimit: number; 
    waterLimit: number;
    discountedConsultationQuota: number;
    freeConsultationQuota: number;
    freeUserScanLimit: number;
    paidUserScanLimit: number;
  }>): Promise<FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }> {
    const response = await httpClient.put<ApiResponse<FreeTierLimits & { foodScanLimits?: { freeTier: number; paidTier: number } }>>(
      API_ENDPOINTS.SETTINGS.LIMITS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update limits');
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

