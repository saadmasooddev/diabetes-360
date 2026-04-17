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
	consultation: {
		date: string;
		startTime: string;
	};
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
  status?: string;
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

	async getMedicationsConsultationId(consultationId: string): Promise<{
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
		queryParams.append("consultationId", consultationId);

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
			`${API_ENDPOINTS.MEDICAL.MEDICATIONS_BY_CONSULTATION_ID}?${queryParams.toString()}`,
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

		const response =
			await httpClient.get<
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
		const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;

		const response =
			await httpClient.get<
				ApiResponse<{ reports: LabReport[]; total: number }>
			>(url);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch lab reports");
		}

		return response.data;
	}

  async requestLabReportUploadUrl(body: {
    fileName: string;
    contentType: string;
    fileSize: number;
    reportName?: string;
    reportType?: string;
    dateOfReport?: string;
  }): Promise<{
    reportId: string;
    uploadUrl: string;
    blobName: string;
    expiresOn: string;
    headers: { "x-ms-blob-type": string; "Content-Type": string };
  }> {
    const response = await httpClient.post<
      ApiResponse<{
        reportId: string;
        uploadUrl: string;
        blobName: string;
        expiresOn: string;
        headers: { "x-ms-blob-type": string; "Content-Type": string };
      }>
    >(API_ENDPOINTS.MEDICAL.LAB_REPORT_REQUEST_UPLOAD, body);

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Failed to get lab report upload URL",
      );
    }

    return response.data;
  }

  async confirmLabReport(reportId: string): Promise<LabReport> {
    const response = await httpClient.post<ApiResponse<LabReport>>(
      API_ENDPOINTS.MEDICAL.LAB_REPORT_CONFIRM(reportId),
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to confirm lab report");
    }

		return response.data;
	}

  async getLabReportDownloadUrl(
    reportId: string,
  ): Promise<{ downloadUrl: string; fileName: string; expiresOn: string }> {
    const response = await httpClient.get<
      ApiResponse<{
        downloadUrl: string;
        fileName: string;
        expiresOn: string;
      }>
    >(API_ENDPOINTS.MEDICAL.LAB_REPORT_DOWNLOAD_URL(reportId));

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Failed to get lab report download URL",
      );
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
    const { reportId, uploadUrl, headers } =
      await this.requestLabReportUploadUrl({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        reportName: metadata?.reportName,
        reportType: metadata?.reportType,
        dateOfReport: metadata?.dateOfReport,
      });

    await axios.put(uploadUrl, file, {
      headers: {
        "x-ms-blob-type": headers["x-ms-blob-type"],
        "Content-Type": headers["Content-Type"],
      },
    });

    return this.confirmLabReport(reportId);
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
  ): Promise<{ blob: Blob; fileName: string }> {
    const authHeader = TokenManager.getAuthHeader();
    let url = `${BASE_URL}${API_ENDPOINTS.MEDICAL.LAB_REPORT_DOWNLOAD(reportId)}`;
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
  ): Promise<{ downloadUrl: string; fileName: string }> {
    const { downloadUrl, fileName } =
      await this.getLabReportDownloadUrl(reportId);
    return { downloadUrl, fileName };
  }

  async getLabReportViewUrl(reportId: string): Promise<string> {
    const { downloadUrl } = await this.getLabReportDownloadUrl(reportId);
    return downloadUrl;
  }
}

export const medicalService = new MedicalService();
