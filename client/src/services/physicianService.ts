import { API_ENDPOINTS } from "@/config/endpoints";
import type { ApiResponse } from "@/types/auth.types";
import { httpClient } from "@/utils/httpClient";

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

export interface NextAvailableSlot {
	slotId: string;
	date: string;
	startTime: string;
	endTime: string;
	slotTypeId: string;
}

export interface Physician {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
	avatar?: string | null;
	specialty: string;
	experience: string;
	rating: number;
	totalRatings: number;
	consultationFee: string;
	imageUrl?: string | null;
	isOnline?: boolean;
	nextAvailableSlot?: NextAvailableSlot | null;
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

export interface PhysicianLocation {
	id: string;
	physicianId: string;
	locationName: string;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	postalCode?: string | null;
	latitude: string;
	longitude: string;
	status: "active" | "inactive";
	createdAt: string;
	updatedAt: string;
}

export interface CreateLocationRequest {
	locationName: string;
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	latitude: string;
	longitude: string;
	status?: "active" | "inactive";
}

export interface UpdateLocationRequest {
	locationName?: string;
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	latitude?: string;
	longitude?: string;
	status?: "active" | "inactive";
}

class PhysicianService {
	// Public consultation endpoints
	async getSpecialties(): Promise<PhysicianSpecialty[]> {
		const response = await httpClient.get<
			ApiResponse<{ specialties: PhysicianSpecialty[] }>
		>(`${API_ENDPOINTS.PHYSICIAN.SPECIALTIES}`);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch specialties");
		}
		return response.data.specialties;
	}

	async getAllPhysicians(): Promise<Physician[]> {
		const response = await httpClient.get<
			ApiResponse<{ physicians: Physician[] }>
		>(API_ENDPOINTS.PHYSICIAN.ALL_PHYSICIANS);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch physicians");
		}
		return response.data.physicians;
	}

	async getPhysiciansPaginated(params: {
		page: number;
		limit: number;
		search?: string;
		specialtyId?: string;
	}): Promise<{
		physicians: Physician[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	}> {
		const recordedAt = new Date().toISOString();
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		const queryParams = new URLSearchParams();
		queryParams.append("date", recordedAt);
		queryParams.append("timeZone", timeZone);
		queryParams.append("page", params.page.toString());
		queryParams.append("limit", params.limit.toString());
		if (params.search) {
			queryParams.append("search", params.search);
		}
		if (params.specialtyId) {
			queryParams.append("specialtyId", params.specialtyId);
		}

		const response = await httpClient.get<
			ApiResponse<{
				physicians: Physician[];
				pagination: {
					page: number;
					limit: number;
					total: number;
					totalPages: number;
					hasNext: boolean;
					hasPrev: boolean;
				};
			}>
		>(`${API_ENDPOINTS.PHYSICIAN.ALL_PHYSICIANS}?${queryParams.toString()}`);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch physicians");
		}
		return response.data;
	}

	async getPhysiciansBySpecialty(specialtyId: string): Promise<Physician[]> {
		const recordedAt = new Date().toISOString();
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const response = await httpClient.get<
			ApiResponse<{ physicians: Physician[] }>
		>(
			`${API_ENDPOINTS.PHYSICIAN.PHYSICIANS_BY_SPECIALTY(specialtyId)}?date=${recordedAt}&timeZone=${timeZone}`,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch physicians");
		}
		return response.data.physicians;
	}

	async getPhysicianRating(physicianId: string): Promise<PhysicianRating> {
		const response = await httpClient.get<
			ApiResponse<{ rating: PhysicianRating }>
		>(API_ENDPOINTS.PHYSICIAN.RATING(physicianId));
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch rating");
		}
		return response.data.rating;
	}

	async createRating(data: CreateRatingRequest): Promise<void> {
		await httpClient.post(
			API_ENDPOINTS.PHYSICIAN.RATING(data.physicianId).replace(
				"/ratings/",
				"/ratings",
			),
			data,
		);
	}

	// Admin endpoints
	async getAllSpecialtiesAdmin(): Promise<PhysicianSpecialty[]> {
		const response = await httpClient.get<
			ApiResponse<{ specialties: PhysicianSpecialty[] }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTIES);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch specialties");
		}
		return response.data.specialties;
	}

	async getSpecialtyById(id: string): Promise<PhysicianSpecialty> {
		const response = await httpClient.get<
			ApiResponse<{ specialty: PhysicianSpecialty }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id));
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch specialty");
		}
		return response.data.specialty;
	}

	async createSpecialty(
		data: CreateSpecialtyRequest,
	): Promise<PhysicianSpecialty> {
		const response = await httpClient.post<
			ApiResponse<{ specialty: PhysicianSpecialty }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTIES, data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to create specialty");
		}
		return response.data.specialty;
	}

	async updateSpecialty(
		id: string,
		data: UpdateSpecialtyRequest,
	): Promise<PhysicianSpecialty> {
		const response = await httpClient.put<
			ApiResponse<{ specialty: PhysicianSpecialty }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id), data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to update specialty");
		}
		return response.data.specialty;
	}

	async deleteSpecialty(id: string): Promise<void> {
		await httpClient.delete(API_ENDPOINTS.PHYSICIAN.ADMIN.SPECIALTY_BY_ID(id));
	}

	async getPhysicianData(userId: string): Promise<PhysicianData> {
		const response = await httpClient.get<
			ApiResponse<{ physicianData: PhysicianData }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.PHYSICIAN_DATA(userId));
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch physician data");
		}
		return response.data.physicianData;
	}

	async createPhysicianData(
		data: CreatePhysicianDataRequest,
	): Promise<PhysicianData> {
		const response = await httpClient.post<
			ApiResponse<{ physicianData: PhysicianData }>
		>("/api/physician/admin/physician-data", data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to create physician data");
		}
		return response.data.physicianData;
	}

	async updatePhysicianData(
		userId: string,
		data: UpdatePhysicianDataRequest,
	): Promise<PhysicianData> {
		const response = await httpClient.put<
			ApiResponse<{ physicianData: PhysicianData }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.PHYSICIAN_DATA(userId), data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to update physician data");
		}
		return response.data.physicianData;
	}

	async uploadImage(file: File): Promise<string> {
		const formData = new FormData();
		formData.append("image", file);
		const response = await httpClient.post<ApiResponse<{ imageUrl: string }>>(
			API_ENDPOINTS.PHYSICIAN.ADMIN.UPLOAD_IMAGE,
			formData,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to upload image");
		}
		return response.data.imageUrl;
	}

	// Location endpoints
	async getAllLocations(): Promise<PhysicianLocation[]> {
		const response = await httpClient.get<
			ApiResponse<{ locations: PhysicianLocation[] }>
		>(API_ENDPOINTS.PHYSICIAN.LOCATIONS);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch locations");
		}
		return response.data.locations;
	}

	// Admin endpoint to get locations for a specific physician
	async getAllLocationsByPhysicianId(
		physicianId: string,
	): Promise<PhysicianLocation[]> {
		const response = await httpClient.get<
			ApiResponse<{ locations: PhysicianLocation[] }>
		>(API_ENDPOINTS.PHYSICIAN.ADMIN.LOCATIONS(physicianId));
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch locations");
		}
		return response.data.locations;
	}

	async createLocation(
		data: CreateLocationRequest,
	): Promise<PhysicianLocation> {
		const response = await httpClient.post<
			ApiResponse<{ location: PhysicianLocation }>
		>(API_ENDPOINTS.PHYSICIAN.LOCATIONS, data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to create location");
		}
		return response.data.location;
	}

	async updateLocation(
		id: string,
		data: UpdateLocationRequest,
	): Promise<PhysicianLocation> {
		const response = await httpClient.patch<
			ApiResponse<{ location: PhysicianLocation }>
		>(API_ENDPOINTS.PHYSICIAN.LOCATION_BY_ID(id), data);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to update location");
		}
		return response.data.location;
	}

	async deleteLocation(id: string): Promise<void> {
		await httpClient.delete(API_ENDPOINTS.PHYSICIAN.LOCATION_BY_ID(id));
	}
}

export const physicianService = new PhysicianService();
