import { httpClient } from '@/utils/httpClient';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { ProfileDataFormValues } from '@/schemas/profileData';
import { ApiResponse } from '@/types/auth.types';

export interface CustomerData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  diagnosisDay: string;
  diagnosisMonth: string;
  diagnosisYear: string;
  weight: string;
  height: string;
  diabetesType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDataResponse {
  customerData: CustomerData;
}

class CustomerService {
  async getCustomerData(): Promise<CustomerDataResponse> {
    const response = await httpClient.get<ApiResponse<CustomerDataResponse>>(API_ENDPOINTS.CUSTOMER.PROFILE);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch customer data');
    }
    return response.data;
  }

  async createCustomerData(data: ProfileDataFormValues): Promise<CustomerDataResponse> {
    const response = await httpClient.post<ApiResponse<CustomerDataResponse>>(
      API_ENDPOINTS.CUSTOMER.PROFILE,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create customer data');
    }
    return response.data;
  }

  async updateCustomerData(data: Partial<ProfileDataFormValues>): Promise<CustomerDataResponse> {
    const response = await httpClient.put<ApiResponse<CustomerDataResponse>>(
      API_ENDPOINTS.CUSTOMER.PROFILE,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update customer data');
    }
    return response.data;
  }
}

export const customerService = new CustomerService();

