export interface User {
  id: string;
  username: string;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}
