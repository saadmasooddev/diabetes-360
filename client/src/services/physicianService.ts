import { API_ENDPOINTS } from '@/config/endpoints';
import { ApiResponse } from '@/types/auth.types';
import { httpClient } from '@/utils/httpClient';

export interface PhysicianSpecialty {
  id: string;
  name: string;
  specialty: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Physician {
  id: string;
  fullName: string | null;
  email: string;
  avatar?: string | null;
  specialty: string;
  experience: string;
  rating: number;
  totalRatings: number;
  consultationFee: string;
  imageUrl?: string | null;
  isOnline?: boolean;
}

export interface PhysicianData {
  id: string;
  userId: string;
  specialtyId: string;
  practiceStartDate: string;
  consultationFee: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicianRating {
  averageRating: number;
  totalRatings: number;
}

export interface CreateSpecialtyRequest {
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateSpecialtyRequest {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CreatePhysicianDataRequest {
  userId: string;
  specialtyId: string;
  practiceStartDate: string;
  consultationFee: string;
  imageUrl?: string | null;
}

export interface UpdatePhysicianDataRequest {
  specialtyId?: string;
  practiceStartDate?: string;
  consultationFee?: string;
  imageUrl?: string | null;
}

export interface CreateRatingRequest {
  physicianId: string;
  rating: number;
  comment?: string;
}

class PhysicianService {
  // Public consultation endpoints
  async getSpecialties(): Promise<PhysicianSpecialty[]> {
    const response = await httpClient.get<ApiResponse<{ specialties: PhysicianSpecialty[] }>>(
      API_ENDPOINTS.PHYSICIAN.SPECIALTIES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch specialties');
    }
    return response.data.specialties;
  }

  async getPhysiciansBySpecialty(specialtyId: string): Promise<Physician[]> {
    const response = await httpClient.get<ApiResponse<{ physicians: Physician[] }>>(
      API_ENDPOINTS.PHYSICIAN.PHYSICIANS_BY_SPECIALTY(specialtyId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch physicians');
    }
    return response.data.physicians;
  }

  async getPhysicianRating(physicianId: string): Promise<PhysicianRating> {
    const response = await httpClient.get<ApiResponse<{ rating: PhysicianRating }>>(
      API_ENDPOINTS.PHYSICIAN.RATING(physicianId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch rating');
    }
    return response.data.rating;
  }

  async createRating(data: CreateRatingRequest): Promise<void> {
    await httpClient.post(API_ENDPOINTS.PHYSICIAN.RATING(data.physicianId).replace('/ratings/', '/ratings'), data);
  }

  // Admin endpoints
  async getAllSpecialtiesAdmin(): Promise<PhysicianSpecialty[]> {
    const response = await httpClient.get<ApiResponse<{ specialties: PhysicianSpecialty[] }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTIES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch specialties');
    }
    return response.data.specialties;
  }

  async getSpecialtyById(id: string): Promise<PhysicianSpecialty> {
    const response = await httpClient.get<ApiResponse<{ specialty: PhysicianSpecialty }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch specialty');
    }
    return response.data.specialty;
  }

  async createSpecialty(data: CreateSpecialtyRequest): Promise<PhysicianSpecialty> {
    const response = await httpClient.post<ApiResponse<{ specialty: PhysicianSpecialty }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTIES,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create specialty');
    }
    return response.data.specialty;
  }

  async updateSpecialty(id: string, data: UpdateSpecialtyRequest): Promise<PhysicianSpecialty> {
    const response = await httpClient.put<ApiResponse<{ specialty: PhysicianSpecialty }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update specialty');
    }
    return response.data.specialty;
  }

  async deleteSpecialty(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id));
  }

  async getPhysicianData(userId: string): Promise<PhysicianData> {
    const response = await httpClient.get<ApiResponse<{ physicianData: PhysicianData }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.PHYSICIAN_DATA(userId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch physician data');
    }
    return response.data.physicianData;
  }

  async createPhysicianData(data: CreatePhysicianDataRequest): Promise<PhysicianData> {
    const response = await httpClient.post<ApiResponse<{ physicianData: PhysicianData }>>(
      '/api/physician/admin/physician-data',
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create physician data');
    }
    return response.data.physicianData;
  }

  async updatePhysicianData(userId: string, data: UpdatePhysicianDataRequest): Promise<PhysicianData> {
    const response = await httpClient.put<ApiResponse<{ physicianData: PhysicianData }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.PHYSICIAN_DATA(userId),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update physician data');
    }
    return response.data.physicianData;
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await httpClient.post<ApiResponse<{ imageUrl: string }>>(
      API_ENDPOINTS.PHYSICIAN.ADMIN.UPLOAD_IMAGE,
      formData
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to upload image');
    }
    return response.data.imageUrl;
  }
}

export const physicianService = new PhysicianService();

