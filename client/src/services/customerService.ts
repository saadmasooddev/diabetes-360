import { httpClient } from '@/utils/httpClient';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { ProfileDataFormValues } from '@/schemas/profileData';

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
    const response = await httpClient.get<CustomerDataResponse>(API_ENDPOINTS.CUSTOMER.PROFILE);
    return response.data;
  }

  async createCustomerData(data: ProfileDataFormValues): Promise<CustomerDataResponse> {
    const response = await httpClient.post<CustomerDataResponse>(
      API_ENDPOINTS.CUSTOMER.PROFILE,
      data
    );
    return response.data;
  }

  async updateCustomerData(data: Partial<ProfileDataFormValues>): Promise<CustomerDataResponse> {
    const response = await httpClient.put<CustomerDataResponse>(
      API_ENDPOINTS.CUSTOMER.PROFILE,
      data
    );
    return response.data;
  }
}

export const customerService = new CustomerService();

