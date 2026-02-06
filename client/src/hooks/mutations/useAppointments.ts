import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";

export type ConsultationStatus =
	| "pending"
	| "confirmed"
	| "cancelled"
	| "completed";

export interface UseAppointmentsParams {
	page?: number;
	limit?: number;
	search?: string;
	startDate?: string;
	endDate?: string;
}

export const useAppointments = (params: UseAppointmentsParams = {}) => {
	return useQuery({
		queryKey: ["appointments", params],
		queryFn: () => bookingService.getAppointments(params),
	});
};

export const useUpdateConsultationStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			bookingId,
			status,
		}: {
			bookingId: string;
			status: ConsultationStatus;
		}) => bookingService.updateConsultationStatus(bookingId, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
		},
	});
};
