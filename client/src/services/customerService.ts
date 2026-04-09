import { httpClient } from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import type { ApiResponse } from "@/types/auth.types";
import { DIABETES_TYPE, ProfileDataFormValues } from "@shared/schema";

export interface CustomerData {
	id: string;
	firstName: string;
	lastName: string;
	userId: string;
	gender: string;
	birthday: string; // ISO date string from API
	weight: string;
	height: string;
	diabetesType: DIABETES_TYPE;
	mainGoal?: string;
	medicationInfo?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CustomerDataResponse {
	customerData: CustomerData;
}
interface CustomerProfileResponse {
	profileData: CustomerData;
}

export interface ConsultationQuota {
	discountedConsultationsUsed: number;
	freeConsultationsUsed: number;
	discountedConsultationsLeft: number;
	freeConsultationsLeft: number;
	discountedQuotaLimit: number;
	freeQuotaLimit: number;
}

export interface ConsultationQuotaResponse {
	quota: ConsultationQuota;
}

// Helper function to transform separate date fields to combined date format
function combineDateFields(day: string, month: string, year: string): string {
	if (!day || !month || !year) return "";
	const paddedMonth = String(month).padStart(2, "0");
	const paddedDay = String(day).padStart(2, "0");
	return `${year}-${paddedMonth}-${paddedDay}`;
}

// Helper function to transform combined date format to separate fields
function parseDateToComponents(dateString: string): {
	day: string;
	month: string;
	year: string;
} {
	if (!dateString) return { day: "", month: "", year: "" };
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return { day: "", month: "", year: "" };
		return {
			day: String(date.getDate()).padStart(2, "0"),
			month: String(date.getMonth() + 1).padStart(2, "0"),
			year: String(date.getFullYear()),
		};
	} catch {
		return { day: "", month: "", year: "" };
	}
}

// Transform form data (separate date fields) to API format (combined dates)
function transformFormDataToAPI(
	data: ProfileDataFormValues | Partial<ProfileDataFormValues>,
): any {
	const apiData = {
		firstName: data.firstName,
		lastName: data.lastName,
		gender: data.gender,
		weight: data.weight,
		height: data.height,
		diabetesType: data.diabetesType,
		birthday: "",
		knowsBloodSugarValue: data.knowsBloodSugarValue,
		bloodSugarType: data.bloodSugarType,
		bloodSugarReading: data.bloodSugarReading,
		medicationInfo: data.onDiabetesMedicationOrInsulin,
		mainGoal: data.mainGoal,
	};

	// Transform birthday fields
	if (data.birthDay && data.birthMonth && data.birthYear) {
		apiData.birthday = combineDateFields(
			data.birthDay,
			data.birthMonth,
			data.birthYear,
		);
	}

	return apiData;
}

// Transform API response (combined dates) to form format (separate fields)
function transformAPIDataToForm(data: CustomerData): CustomerData & {
	birthDay: string;
	birthMonth: string;
	birthYear: string;
} {
	const birthdayComponents = parseDateToComponents(data.birthday);

	return {
		...data,
		birthDay: birthdayComponents.day,
		birthMonth: birthdayComponents.month,
		birthYear: birthdayComponents.year,
	};
}

class CustomerService {
	async getCustomerData(): Promise<CustomerDataResponse> {
		const response = await httpClient.get<ApiResponse<CustomerProfileResponse>>(
			API_ENDPOINTS.CUSTOMER.PROFILE,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch customer data");
		}
		// Transform API response to include separate date fields for form compatibility
		return {
			customerData: transformAPIDataToForm(response.data.profileData),
		};
	}

	async createCustomerData(
		data: ProfileDataFormValues,
	): Promise<CustomerDataResponse> {
		// Transform form data to API format
		const apiData = transformFormDataToAPI(data);
		const response = await httpClient.post<
			ApiResponse<CustomerProfileResponse>
		>(API_ENDPOINTS.CUSTOMER.PROFILE, apiData);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to create customer data");
		}
		// Transform response back to form format
		return {
			customerData: transformAPIDataToForm(response.data.profileData),
		};
	}

	async updateCustomerData(
		data: Partial<ProfileDataFormValues>,
	): Promise<CustomerDataResponse> {
		// Transform form data to API format
		const apiData = transformFormDataToAPI(data);
		const response = await httpClient.put<ApiResponse<CustomerProfileResponse>>(
			API_ENDPOINTS.CUSTOMER.PROFILE,
			apiData,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to update customer data");
		}
		// Transform response back to form format
		return {
			customerData: transformAPIDataToForm(response.data.profileData),
		};
	}

	async getConsultationQuotas(): Promise<ConsultationQuotaResponse> {
		const response = await httpClient.get<
			ApiResponse<ConsultationQuotaResponse>
		>(API_ENDPOINTS.CUSTOMER.CONSULTATION_QUOTAS);
		if (!response.success || !response.data) {
			throw new Error(
				response.message || "Failed to fetch consultation quotas",
			);
		}
		return response.data;
	}
}

export const customerService = new CustomerService();
