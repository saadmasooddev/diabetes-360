import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { patientService } from "@/services/patientService";
import type { DateRange } from "@/features/dashboard/components/HealthTrendChart";
import { useToast } from "@/hooks/use-toast";

export interface UsePatientsParams {
	page?: number;
	limit?: number;
	search?: string;
}

export const usePatients = (params: UsePatientsParams = {}) => {
	return useQuery({
		queryKey: ["patients", params],
		queryFn: () => patientService.getPatients(params),
	});
};

export const usePatientStats = () => {
	return useQuery({
		queryKey: ["patient-stats"],
		queryFn: () => patientService.getPatientStats(),
	});
};

export const usePatientById = (
	patientId: string | null,
	dateRange: DateRange,
) => {
	return useQuery({
		queryKey: ["patient", patientId, dateRange],
		queryFn: () => {
			if (!patientId) throw new Error("Patient ID is required");
			return patientService.getPatientById(patientId, dateRange);
		},
		enabled: !!patientId,
	});
};

export const usePatientAlerts = () => {
	const { toast } = useToast();
	const result = useQuery({
		queryKey: ["patient-alerts"],
		queryFn: () => patientService.getPatientAlerts(),
	});

	useEffect(() => {
		if (result.error) {
			toast({
				title: "Patient alerts",
				description: "Failed to load patient alerts. Please try again.",
				variant: "destructive",
			});
		}
	}, [result.error, toast]);

	return result;
};
