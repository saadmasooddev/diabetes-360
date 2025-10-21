import { API_ENDPOINTS } from '@/config/endpoints';
import type { SignupRequest, LoginRequest, AuthResponse } from '@/types/auth.types';

export const authService = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  logout: async (): Promise<void> => {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Logout failed');
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },
};
