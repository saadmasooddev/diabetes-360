import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  RefreshTokenRequest, 
  LogoutRequest,
  RefreshTokenResponse,
  LogoutResponse,
  ForgotPasswordResponse,
  AuthData,
  RefreshTokenData,
  ForgotPasswordData
} from '@/types/auth.types';

class AuthService {
  async signup(data: SignupRequest): Promise<AuthData> {
    const response = await httpClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Signup failed');
    }
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthData> {
    const response = await httpClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }
    return response.data;
  }

  async refreshTokens(data: RefreshTokenRequest): Promise<RefreshTokenData> {
    const response = await httpClient.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Token refresh failed');
    }
    return response.data;
  }

  async logout(data: LogoutRequest): Promise<string> {
    const response = await httpClient.post<LogoutResponse>(API_ENDPOINTS.AUTH.LOGOUT, data);
    if (!response.success) {
      throw new Error(response.message || 'Logout failed');
    }
    return response.message || 'Logged out successfully';
  }

  async forgotPassword(email: string) : Promise<string> {
    const response = await httpClient.post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Request failed');
    }
    return response.data.message;
  }

  async resetPassword(token: string, password: string): Promise<string> {
    const response = await httpClient.post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Password reset failed');
    }
    return response.data.message;
  }
}

export const authService = new AuthService();
