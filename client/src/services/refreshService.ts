import axios from 'axios';
import type {  RefreshTokenResponse, RefreshTokenData } from '@/types/auth.types';
import { BASE_URL } from '@/utils/httpClient';


class RefreshService {
  async refreshTokens(refreshToken: string): Promise<RefreshTokenData> {
    try {
      
    const response = await axios.post<RefreshTokenResponse>(
      `${BASE_URL}/api/auth/refresh`, 
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Token refresh failed');
    }
    return response.data.data;
    } catch (error) {
    throw error
    }
  }
}

export const refreshService = new RefreshService();
