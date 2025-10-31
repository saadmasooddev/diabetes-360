import axios from 'axios';
import type { TokenPair, RefreshTokenResponse, RefreshTokenData } from '@/types/auth.types';

class RefreshService {
  async refreshTokens(refreshToken: string): Promise<RefreshTokenData> {
    const response = await axios.post<RefreshTokenResponse>('/api/auth/refresh', { refreshToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Token refresh failed');
    }
    return response.data.data;
  }
}

export const refreshService = new RefreshService();
