import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
	settingsService,
	type FoodScanStatus,
	type ExtendedLimits,
} from "@/services/settingsService";
import { API_ENDPOINTS } from "@/config/endpoints";

export const useLimits = () => {
	return useQuery<ExtendedLimits>({
		queryKey: [API_ENDPOINTS.SETTINGS.LIMITS],
		queryFn: () => settingsService.getLimits(),
		refetchOnMount: "always",
		staleTime: 0,
	});
};

export const useCreateLimits = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: Partial<{
				glucoseLimit: number;
				stepsLimit: number;
				waterLimit: number;
				discountedConsultationQuota: number;
				freeConsultationQuota: number;
				freeUserScanLimit: number;
				paidUserScanLimit: number;
			}>,
		) => {
			return await settingsService.createLimits(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ENDPOINTS.SETTINGS.LIMITS],
			});

			toast({
				title: "Success",
				description: "Limits created successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to create limits",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateLimits = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: Partial<{
				glucoseLimit: number;
				stepsLimit: number;
				waterLimit: number;
				discountedConsultationQuota: number;
				freeConsultationQuota: number;
				freeUserScanLimit: number;
				paidUserScanLimit: number;
			}>,
		) => {
			return await settingsService.updateLimits(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [API_ENDPOINTS.SETTINGS.LIMITS],
			});

			toast({
				title: "Success",
				description: "Limits updated successfully",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Error",
				description: error.message || "Failed to update limits",
				variant: "destructive",
			});
		},
	});
};

export const useFoodScanStatus = () => {
	return useQuery<FoodScanStatus>({
		queryKey: [API_ENDPOINTS.SETTINGS.FOOD_SCAN_STATUS],
		queryFn: () => settingsService.getFoodScanStatus(),
		refetchOnMount: "always",
		staleTime: 0,
		refetchInterval: 60000, // Refetch every minute to keep status updated
	});
};
