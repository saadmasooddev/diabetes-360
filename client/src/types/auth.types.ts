export type UserTier = 'free' | 'paid';

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  emailVerified: boolean;
  provider: string;
  providerId?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'physician';
  tier?: UserTier;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Backend response structure
export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  data?: T;
  message: string;
}

// Auth-specific response data
export interface AuthData {
  user: User;
  tokens: TokenPair;
}

export interface RefreshTokenData {
  tokens: TokenPair;
}

export interface LogoutData {
  message: string;
}

export interface ForgotPasswordData {
  message: string;
}

// Response types for each endpoint
export interface AuthResponse extends ApiResponse<AuthData> {}
export interface RefreshTokenResponse extends ApiResponse<RefreshTokenData> {}
export interface LogoutResponse extends ApiResponse<LogoutData> {}
export interface ForgotPasswordResponse extends ApiResponse<ForgotPasswordData> {}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}
