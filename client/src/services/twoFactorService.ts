import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { ApiResponse } from '@/types/auth.types';

export interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
}

export interface Setup2FAResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  token: string;
}

export interface Verify2FAResponse {
  verified: boolean;
}

export interface RegenerateBackupCodesResponse {
  backupCodes: string[];
}

class TwoFactorService {
  async getStatus(): Promise<TwoFactorStatus> {
    const response = await httpClient.get<ApiResponse<TwoFactorStatus>>(
      API_ENDPOINTS.TWO_FACTOR.STATUS
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch 2FA status');
    }
    return response.data;
  }

  async setup(): Promise<Setup2FAResponse> {
    const response = await httpClient.post<ApiResponse<Setup2FAResponse>>(
      API_ENDPOINTS.TWO_FACTOR.SETUP
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to setup 2FA');
    }
    return response.data;
  }

  async verifyAndEnable(data: Verify2FARequest): Promise<Verify2FAResponse> {
    const response = await httpClient.post<ApiResponse<Verify2FAResponse>>(
      API_ENDPOINTS.TWO_FACTOR.VERIFY,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to verify 2FA');
    }
    return response.data;
  }

  async disable(): Promise<void> {
    const response = await httpClient.post<ApiResponse<null>>(
      API_ENDPOINTS.TWO_FACTOR.DISABLE
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to disable 2FA');
    }
  }

  async regenerateBackupCodes(): Promise<string[]> {
    const response = await httpClient.post<ApiResponse<RegenerateBackupCodesResponse>>(
      API_ENDPOINTS.TWO_FACTOR.REGENERATE_BACKUP_CODES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to regenerate backup codes');
    }
    return response.data.backupCodes;
  }
}

export const twoFactorService = new TwoFactorService();

