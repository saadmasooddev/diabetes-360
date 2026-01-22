import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";

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
		queryFn: () =>
			bookingService.getAppointments({
				...params,
				startDate: params.startDate || new Date().toISOString(),
				endDate: params.endDate || new Date().toISOString(),
			}),
	});
};
