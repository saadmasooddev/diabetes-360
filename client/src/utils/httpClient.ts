import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { TokenManager } from './tokenManager';
import { refreshService } from '@/services/refreshService';
import type { TokenPair } from '@/types/auth.types';

export const BASE_URL = import.meta.env.VITE_REACT_API_BASE_URL || '';

class HttpClient {
  private readonly baseURL = BASE_URL;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authHeader = TokenManager.getAuthHeader();
        if (authHeader) {
          config.headers.Authorization = authHeader;
        }
        // Don't set Content-Type for FormData - let axios handle it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // If we get a 401 and haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && TokenManager.hasTokens()) {
          originalRequest._retry = true;

          try {
            await this.refreshTokens();
            
            // Retry the original request with new token
            const newAuthHeader = TokenManager.getAuthHeader();
            if (newAuthHeader) {
              originalRequest.headers.Authorization = newAuthHeader;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            TokenManager.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshTokens(): Promise<TokenPair> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<TokenPair> {
    const refreshToken = TokenManager.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await refreshService.refreshTokens(refreshToken);
      TokenManager.setTokens(response.tokens);
      return response.tokens;
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      TokenManager.clearTokens();
      throw error;
    }
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }
}

export const httpClient = new HttpClient();