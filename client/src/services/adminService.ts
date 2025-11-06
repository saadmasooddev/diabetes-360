import { API_ENDPOINTS } from '@/config/endpoints';
import { ApiResponse } from '@/types/auth.types';
import { httpClient } from '@/utils/httpClient';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  provider: string;
  providerId?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'physician';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customerData?: any; // Customer data if user is a customer
}

export interface CustomerData {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female';
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  diagnosisDay?: string;
  diagnosisMonth?: string;
  diagnosisYear?: string;
  weight?: string;
  height?: string;
  diabetesType: 'type1' | 'type2' | 'gestational' | 'prediabetes';
}

export interface PhysicianData {
  specialtyId: string;
  practiceStartDate: string;
  consultationFee: string;
  imageUrl?: string | null;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'physician';
  isActive?: boolean;
  physicianData?: PhysicianData;
  customerData?: CustomerData;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  password?: string;
  role?: 'customer' | 'admin' | 'physician';
  isActive?: boolean;
  physicianData?: Partial<PhysicianData>;
  customerData?: Partial<CustomerData>;
}


export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  provider: string;
  providerId?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'physician';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customerData?: any; // Customer data if user is a customer
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'physician';
  isActive?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  password?: string;
  role?: 'customer' | 'admin' | 'physician';
  isActive?: boolean;
}

class AdminService {
  async getAllUsers(): Promise<User[]> {
    const response = await httpClient.get<ApiResponse<{ users: User[] }>>(API_ENDPOINTS.ADMIN.USERS);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch users');
    }
    return response.data.users;
  }

  async getUserById(id: string): Promise<{ user: User; customerData?: any }> {
    const response = await httpClient.get<ApiResponse<{ user: User; customerData?: any }>>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }
    // Merge customerData into user object for convenience
    if (response.data.customerData) {
      response.data.user.customerData = response.data.customerData;
    }
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await httpClient.post<ApiResponse<{ user: User }>>(API_ENDPOINTS.ADMIN.USERS, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create user');
    }
    return response.data.user;
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await httpClient.put<ApiResponse<{ user: User }>>(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }
    return response.data.user;
  }

  async deleteUser(id: string): Promise<void> {
     await httpClient.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`);
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await httpClient.patch<ApiResponse<{ user: User }>>(`${API_ENDPOINTS.ADMIN.USERS}/${id}/status`, { isActive });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to toggle user status');
    }
    return response.data.user;
  }
}


export const adminService = new AdminService();
