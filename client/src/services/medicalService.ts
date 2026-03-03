import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import axios from "axios";
import { TokenManager } from "@/utils/tokenManager";
import { BASE_URL } from "@/utils/env";

export interface Medicine {
	name: string;
	dosage?: string;
	frequency?: string;
	duration?: string;
	instructions?: string;
}

export interface Medication {
	id: string;
	userId: string;
	consultationId: string;
	physicianId: string;
	prescriptionDate: string;
	medicines: Medicine[];
	physician?: {
		id: string;
		firstName: string;
		lastName: string;
		specialty?: string;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface LabReport {
	id: string;
	userId: string;
	fileName: string;
	filePath: string;
	fileSize: string;
	reportName?: string | null;
	reportType?: string | null;
	dateOfReport?: string | null;
	uploadedAt: string;
	createdAt: string;
	updatedAt: string;
}

class MedicalService {
	async getMedications(params?: { limit?: number; offset?: number }): Promise<{
		medications: Medication[];
		total: number;
		page: number;
		limit: number;
	}> {
		const queryParams = new URLSearchParams();
		if (params?.limit) queryParams.append("limit", params.limit.toString());
		if (params?.offset) queryParams.append("offset", params.offset.toString());

		const url = queryParams.toString()
			? `${API_ENDPOINTS.MEDICAL.MEDICATIONS}?${queryParams.toString()}`
			: API_ENDPOINTS.MEDICAL.MEDICATIONS;

		const response =
			await httpClient.get<
				ApiResponse<{
					medications: Medication[];
					total: number;
					page: number;
					limit: number;
				}>
			>(url);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch medications");
		}

		return response.data;
	}

	async getMedicationsByPhysicianAndDate(
		physicianId: string,
		prescriptionDate: string,
	): Promise<{
		medications: Medication[];
		physician: {
			id: string;
			firstName: string;
			lastName: string;
			specialty?: string;
		} | null;
		prescriptionDate: string;
	}> {
		const queryParams = new URLSearchParams();
		queryParams.append("physicianId", physicianId);
		queryParams.append("prescriptionDate", prescriptionDate);

		const response = await httpClient.get<
			ApiResponse<{
				medications: Medication[];
				physician: {
					id: string;
					firstName: string;
					lastName: string;
					specialty?: string;
				} | null;
				prescriptionDate: string;
			}>
		>(
			`${API_ENDPOINTS.MEDICAL.MEDICATIONS_BY_PHYSICIAN}?${queryParams.toString()}`,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch medications");
		}

		return response.data;
	}

	async getLabReports(params?: {
		limit?: number;
		offset?: number;
		search?: string;
	}): Promise<{ reports: LabReport[]; total: number }> {
		const queryParams = new URLSearchParams();
		if (params?.limit) queryParams.append("limit", params.limit.toString());
		if (params?.offset) queryParams.append("offset", params.offset.toString());
		if (params?.search) queryParams.append("search", params.search);

		const url = queryParams.toString()
			? `${API_ENDPOINTS.MEDICAL.LAB_REPORTS}?${queryParams}`
			: API_ENDPOINTS.MEDICAL.LAB_REPORTS;

		const response = await httpClient.get<
			ApiResponse<{ reports: LabReport[]; total: number }>
		>(url);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch lab reports");
		}

		return response.data;
	}

	async getLabReportsByUserId(
		userId: string,
		params?: { limit?: number; offset?: number; search?: string },
	): Promise<{ reports: LabReport[]; total: number }> {
		const queryParams = new URLSearchParams();
		if (params?.limit) queryParams.append("limit", params.limit.toString());
		if (params?.offset) queryParams.append("offset", params.offset.toString());
		if (params?.search) queryParams.append("search", params.search);

		const baseUrl = API_ENDPOINTS.MEDICAL.LAB_REPORTS_BY_USER(userId);
		const url = queryParams.toString()
			? `${baseUrl}?${queryParams}`
			: baseUrl;

		const response = await httpClient.get<
			ApiResponse<{ reports: LabReport[]; total: number }>
		>(url);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch lab reports");
		}

		return response.data;
	}

	async uploadLabReport(
		file: File,
		metadata?: {
			reportName?: string;
			reportType?: string;
			dateOfReport?: string;
		},
	): Promise<LabReport> {
		const formData = new FormData();
		formData.append("file", file);
		if (metadata?.reportName)
			formData.append("reportName", metadata.reportName);
		if (metadata?.reportType)
			formData.append("reportType", metadata.reportType);
		if (metadata?.dateOfReport)
			formData.append("dateOfReport", metadata.dateOfReport);

		const response = await httpClient.post<ApiResponse<LabReport>>(
			API_ENDPOINTS.MEDICAL.LAB_REPORTS,
			formData,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to upload lab report");
		}

		return response.data;
	}

	async updateLabReport(reportId: string, file: File): Promise<LabReport> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await httpClient.put<ApiResponse<LabReport>>(
			API_ENDPOINTS.MEDICAL.LAB_REPORT_UPDATE(reportId),
			formData,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to update lab report");
		}

		return response.data;
	}

	async deleteLabReport(reportId: string): Promise<void> {
		const response = await httpClient.delete<ApiResponse<null>>(
			API_ENDPOINTS.MEDICAL.LAB_REPORT_DELETE(reportId),
		);

		if (!response.success) {
			throw new Error(response.message || "Failed to delete lab report");
		}
	}

	async fetchLabReportBlob(
		reportId: string,
		forUserId?: string,
	): Promise<{ blob: Blob; fileName: string }> {
		const authHeader = TokenManager.getAuthHeader();
		let url = `${BASE_URL}${API_ENDPOINTS.MEDICAL.LAB_REPORT_DOWNLOAD(reportId)}`;
		if (forUserId) {
			url += `?userId=${encodeURIComponent(forUserId)}`;
		}
		const response = await axios.get(url, {
			headers: {
				Authorization: authHeader || "",
			},
			responseType: "blob",
		});

		// Extract filename from Content-Disposition header
		const contentDisposition = response.headers["content-disposition"];
		let fileName = "lab-report.pdf";
		if (contentDisposition) {
			const fileNameMatch = contentDisposition.match(
				/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
			);
			if (fileNameMatch && fileNameMatch[1]) {
				fileName = fileNameMatch[1].replace(/['"]/g, "");
			}
		}

		return {
			blob: response.data,
			fileName,
		};
	}

	async downloadLabReport(
		reportId: string,
		forUserId?: string,
	): Promise<{ blob: Blob; fileName: string }> {
		return this.fetchLabReportBlob(reportId, forUserId);
	}

	async getLabReportViewUrl(
		reportId: string,
		forUserId?: string,
	): Promise<string> {
		const { blob } = await this.fetchLabReportBlob(reportId, forUserId);
		return URL.createObjectURL(blob);
	}
}

export const medicalService = new MedicalService();
