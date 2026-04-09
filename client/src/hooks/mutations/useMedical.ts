import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
	medicalService,
	type Medication,
	type LabReport,
} from "@/services/medicalService";
import { API_ENDPOINTS } from "@/config/endpoints";
import {
	UpdateConsultationNotePayload,
	bookingService,
} from "@/services/bookingService";

// Medications Hooks
export const useMedications = (params?: {
	limit?: number;
	offset?: number;
}) => {
	return useQuery<{
		medications: Medication[];
		total: number;
		page: number;
		limit: number;
	}>({
		queryKey: [
			API_ENDPOINTS.MEDICAL.MEDICATIONS,
			params?.limit,
			params?.offset,
		],
		queryFn: () => medicalService.getMedications(params),
		refetchOnMount: "always",
		staleTime: 0,
	});
};

export const useMedicationsByConsultationId = (
	consultationId: string | null,
) => {
	return useQuery<{
		medications: Medication[];
		physician: {
			id: string;
			firstName: string;
			lastName: string;
			specialty?: string;
		} | null;
		prescriptionDate: string;
	}>({
		queryKey: [
			API_ENDPOINTS.MEDICAL.MEDICATIONS_BY_CONSULTATION_ID,
			consultationId,
		],
		queryFn: () => medicalService.getMedicationsConsultationId(consultationId!),
		enabled: !!consultationId,
		refetchOnMount: "always",
		staleTime: 0,
	});
};

// Lab Reports Hooks
export const useLabReports = (params?: {
	limit?: number;
	offset?: number;
	search?: string;
}) => {
	return useQuery<{ reports: LabReport[]; total: number }>({
		queryKey: [
			API_ENDPOINTS.MEDICAL.LAB_REPORTS,
			params?.limit,
			params?.offset,
			params?.search,
		],
		queryFn: () => medicalService.getLabReports(params),
		refetchOnMount: "always",
		staleTime: 0,
	});
};

export const useLabReportsByUserId = (
	userId: string | null,
	params?: { limit?: number; offset?: number; search?: string },
) => {
	return useQuery<{ reports: LabReport[]; total: number }>({
		queryKey: [
			userId ? API_ENDPOINTS.MEDICAL.LAB_REPORTS_BY_USER(userId) : null,
			params?.limit,
			params?.offset,
			params?.search,
		],
		queryFn: () => medicalService.getLabReportsByUserId(userId!, params),
		enabled: !!userId,
		refetchOnMount: "always",
		staleTime: 0,
	});
};

export const useUploadLabReport = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (
			arg:
				| File
				| {
						file: File;
						metadata?: {
							reportName?: string;
							reportType?: string;
							dateOfReport?: string;
						};
				  },
		) => {
			const file = arg instanceof File ? arg : arg.file;
			const metadata = arg instanceof File ? undefined : arg.metadata;
			return medicalService.uploadLabReport(file, metadata);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ENDPOINTS.MEDICAL.LAB_REPORTS],
			});
			toast({
				title: "Success",
				description: "Lab report uploaded successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to upload lab report",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateLabReport = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ reportId, file }: { reportId: string; file: File }) =>
			medicalService.updateLabReport(reportId, file),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ENDPOINTS.MEDICAL.LAB_REPORTS],
			});
			toast({
				title: "Success",
				description: "Lab report updated successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update lab report",
				variant: "destructive",
			});
		},
	});
};

export const useDeleteLabReport = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (reportId: string) => medicalService.deleteLabReport(reportId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ENDPOINTS.MEDICAL.LAB_REPORTS],
			});
			toast({
				title: "Success",
				description: "Lab report deleted successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to delete lab report",
				variant: "destructive",
			});
		},
	});
};

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

export function isImageFileName(fileName: string): boolean {
	return IMAGE_EXTENSIONS.test(fileName);
}

export function isPdfFileName(fileName: string): boolean {
	return /\.pdf$/i.test(fileName);
}

export const useViewLabReport = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (arg: {
			reportId: string;
			fileName: string;
		}): Promise<{ url: string; isPdf: boolean }> => {
			const url = await medicalService.getLabReportViewUrl(arg.reportId);
			const isPdf = isPdfFileName(arg.fileName);
			if (isPdf) {
				window.open(url, "_blank", "noopener,noreferrer");
			}
			return { url, isPdf };
		},
		onError: (error: unknown) => {
			toast({
				title: "Error",
				description: (error as Error).message || "Failed to open report",
				variant: "destructive",
			});
		},
	});
};

export const useDownloadLabReport = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: async (reportId: string) => {
			const { blob, fileName } =
				await medicalService.downloadLabReport(reportId);

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			return { blob, fileName };
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to download lab report",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateConsultationNote = () => {
	return useMutation({
		mutationFn: ({
			bookingId,
			payload,
		}: {
			bookingId: string;
			payload: UpdateConsultationNotePayload;
		}) => bookingService.updateConsultationNote(bookingId, payload),
	});
};
