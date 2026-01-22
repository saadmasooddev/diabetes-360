import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import type { DateRange } from "@/features/dashboard/components/HealthTrendChart";
import type { MertricRecord } from "@shared/schema";
import { UserConsultation } from "server/src/modules/booking/repository/booking.repository";

export interface PatientListItem {
	id: string;
	name: string;
	age: number;
	condition: string;
	indication: "Needs Attention" | "Stable" | "High Risk";
	indicationColor: string;
}

export interface PatientStats {
	diseaseDistribution: Array<{
		name: string;
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
	diagnosisDate: string;
	weight: string;
	height: string;
	diabetesType: string;
	gender: string;
	indication: "Needs Attention" | "Stable" | "High Risk";
	indicationColor: string;
	riskLevel: "High Risk" | "Stable" | "Needs Attention";
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
	appointments: UserConsultation[],
  glucoseTrend: MertricRecord[];
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
			status: "high-risk";
			statusColor: string;
		}>;
		stable: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: "stable";
			statusColor: string;
		}>;
		needsAttention: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: "needs-attention";
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
					status: "high-risk";
					statusColor: string;
				}>;
				stable: Array<{
					id: string;
					name: string;
					age: number;
					diabetesType: string;
					tags: Array<{ text: string; color: string }>;
					status: "stable";
					statusColor: string;
				}>;
				needsAttention: Array<{
					id: string;
					name: string;
					age: number;
					diabetesType: string;
					tags: Array<{ text: string; color: string }>;
					status: "needs-attention";
					statusColor: string;
				}>;
			}>
		>(API_ENDPOINTS.PHYSICIAN.PATIENT_ALERTS);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch patient alerts");
		}
		return response.data;
	}
}

export const patientService = new PatientService();
