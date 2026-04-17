import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import type { DateRange } from "@/features/dashboard/components/HealthTrendChart";
import type { DIABETES_TYPE, MertricRecord } from "@shared/schema";
import { UserConsultation } from "server/src/modules/booking/repository/booking.repository";
import { PATIENT_INDICATION } from "server/src/modules/physician/utils/patientColors";
import { PatientListItem } from "server/src/modules/physician/repository/patient.repository";

/** TODO: Define and align with server when documents endpoint is created. */
export interface PatientDocumentsResponse {
	documents: Array<{
		id: string;
		name: string;
		type?: string;
		url: string;
		uploadedAt: string;
	}>;
}

export interface PatientStats {
	diseaseDistribution: Array<{
		name: DIABETES_TYPE;
		percentage: number;
		color: string;
	}>;
	indicationDistribution: Array<{
		name: string;
		percentage: number;
		color: string;
	}>;
}

export interface PatientProfile {
	id: string;
	name: string;
	age: number;
	condition: string;
	email: string;
	birthday: string;
	weight: string;
	height: string;
	diabetesType: DIABETES_TYPE;
	gender: string;
	indication: PATIENT_INDICATION;
	indicationColor: string;
	riskLevel: PATIENT_INDICATION;
	riskLevelColor: string;
	alerts: Array<{ text: string; color: string }>;
	glucoseSummary: {
		highs: number;
		lows: number;
		timeInRange: number;
	};
	recentNotes: string[];
	consultationSummaries?: Array<{
		summary: string;
		date: string;
		physicianName?: string;
	}>;
	appointments: UserConsultation[];
	upcomingAppointments: UserConsultation[];
	glucoseTrend: MertricRecord[];
	latestBloodGlucose?: number | null;
	hba1cTrend?: Array<{ value: number; recordedAt: string }>;
	quickLogsWeek?: Array<{
		logDate: string;
		exercise: string | null;
		sleepDuration: string | null;
	}>;
	dietTrend?: {
		avgRecommendedCalories: number;
		avgLoggedCalories: number;
		totalRecommended: number;
		totalLogged: number;
	};
	macros?: {
		carbs: number;
		protein: number;
		fat: number;
		calories: number;
		carbsPercent: number;
		proteinPercent: number;
		fatPercent: number;
	};
	sleepPattern?: {
		byDay: Array<{ day: string; hours: number; quality: string }>;
		avgQuality: string;
	};
}

class PatientService {
	async getPatients(
		params: { page?: number; limit?: number; search?: string } = {},
	): Promise<{
		patients: PatientListItem[];
		total: number;
		page: number;
		limit: number;
	}> {
		const queryParams = new URLSearchParams();
		if (params.page) queryParams.append("page", params.page.toString());
		if (params.limit) queryParams.append("limit", params.limit.toString());
		if (params.search) queryParams.append("search", params.search);

		const response = await httpClient.get<
			ApiResponse<{
				patients: PatientListItem[];
				total: number;
				page: number;
				limit: number;
			}>
		>(`${API_ENDPOINTS.PHYSICIAN.PATIENTS}?${queryParams.toString()}`);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch patients");
		}
		return response.data;
	}

	async getPatientStats(): Promise<PatientStats> {
		const response = await httpClient.get<ApiResponse<PatientStats>>(
			API_ENDPOINTS.PHYSICIAN.PATIENT_STATS,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch patient statistics");
		}
		return response.data;
	}

	async getPatientById(
		patientId: string,
		dateRange: DateRange,
	): Promise<PatientProfile> {
		const queryParams = new URLSearchParams();
		if (dateRange.startDate)
			queryParams.append("startDate", dateRange.startDate);
		if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate);
		const response = await httpClient.get<
			ApiResponse<{ patient: PatientProfile }>
		>(
			API_ENDPOINTS.PHYSICIAN.PATIENT_BY_ID(patientId) +
				`?${queryParams.toString()}`,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch patient profile");
		}
		return response.data.patient;
	}

	async getPatientAlerts(): Promise<{
		highRisk: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: "High Risk";
			statusColor: string;
		}>;
		stable: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: "Stable";
			statusColor: string;
		}>;
		needsAttention: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: "Needs Attention";
			statusColor: string;
		}>;
	}> {
		const response = await httpClient.get<
			ApiResponse<{
				highRisk: Array<{
					id: string;
					name: string;
					age: number;
					diabetesType: string;
					tags: Array<{ text: string; color: string }>;
					status: "High Risk";
					statusColor: string;
				}>;
				stable: Array<{
					id: string;
					name: string;
					age: number;
					diabetesType: string;
					tags: Array<{ text: string; color: string }>;
					status: "Stable";
					statusColor: string;
				}>;
				needsAttention: Array<{
					id: string;
					name: string;
					age: number;
					diabetesType: string;
					tags: Array<{ text: string; color: string }>;
					status: "Needs Attention";
					statusColor: string;
				}>;
			}>
		>(API_ENDPOINTS.PHYSICIAN.PATIENT_ALERTS);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch patient alerts");
		}
		return response.data;
	}

	// TODO: Backend endpoint not yet created. Replace with real API call when endpoint is ready.
	// Expected server response type: PatientDocumentsResponse
	async getPatientDocuments(
		_patientId: string,
	): Promise<PatientDocumentsResponse> {
		// const response = await httpClient.get<ApiResponse<PatientDocumentsResponse>>(
		//   API_ENDPOINTS.PHYSICIAN.PATIENT_DOCUMENTS(patientId)
		// );
		// if (!response.success || !response.data) throw new Error(response.message);
		// return response.data;
		return { documents: [] };
	}
}

export const patientService = new PatientService();
