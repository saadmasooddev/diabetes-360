import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
	medicalService,
	type Medication,
	type LabReport,
} from "@/services/medicalService";
import { API_ENDPOINTS } from "@/config/endpoints";

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

export const useMedicationsByPhysicianAndDate = (
	physicianId: string | null,
	prescriptionDate: string | null,
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
			API_ENDPOINTS.MEDICAL.MEDICATIONS_BY_PHYSICIAN,
			physicianId,
			prescriptionDate,
		],
		queryFn: () =>
			medicalService.getMedicationsByPhysicianAndDate(
				physicianId!,
				prescriptionDate!,
			),
		enabled: !!physicianId && !!prescriptionDate,
		refetchOnMount: "always",
		staleTime: 0,
	});
};

// Lab Reports Hooks
export const useLabReports = () => {
	return useQuery<LabReport[]>({
		queryKey: [API_ENDPOINTS.MEDICAL.LAB_REPORTS],
		queryFn: () => medicalService.getLabReports(),
		refetchOnMount: "always",
		staleTime: 0,
	});
};

export const useUploadLabReport = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (file: File) => medicalService.uploadLabReport(file),
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
