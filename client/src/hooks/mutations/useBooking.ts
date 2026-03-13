import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	bookingService,
	type CreateSlotsRequest,
	type BookSlotRequest,
	type UpdateSlotLocationsRequest,
	type BookingPriceCalculation,
} from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { getConsultationQuotasKey } from "./useCustomer";

const getCalculateBookingPriceKey = (physicianId: string | null) => {
	const key = ["booking", "calculate-price", physicianId];
	return key;
};

export const useSlotSizes = () => {
	return useQuery({
		queryKey: ["booking", "slot-sizes"],
		queryFn: () => bookingService.getSlotSizes(),
	});
};

export const useSlotTypes = () => {
	return useQuery({
		queryKey: ["booking", "slot-types"],
		queryFn: () => bookingService.getSlotTypes(),
	});
};

export const useAvailabilityDates = () => {
	return useQuery({
		queryKey: ["booking", "availability-dates"],
		queryFn: () => bookingService.getAvailabilityDates(),
	});
};

export const useDatesWithAvailability = (physicianId: string | null) => {
	return useQuery({
		queryKey: ["booking", "dates-with-availability", physicianId],
		queryFn: () => bookingService.getDatesWithAvailability(physicianId!),
		enabled: !!physicianId,
	});
};

export const useSlotsForDate = (
	physicianId: string | null,
	date: string | null,
) => {
	return useQuery({
		queryKey: ["booking", "slots", physicianId, date],
		queryFn: () => bookingService.getSlotsForDate(physicianId!, date!),
		enabled: !!physicianId && !!date,
	});
};

export const useAvailableSlotsForDate = (
	physicianId: string | null,
	date: string | null,
) => {
	return useQuery({
		queryKey: ["booking", "available-slots", physicianId, date],
		queryFn: () => bookingService.getAvailableSlotsForDate(physicianId!, date!),
		enabled: !!physicianId && !!date,
	});
};

export type PhysicianDatesWithSlots = {
	key: (string | number | boolean | null)[];
	params: {
		physicianId: string | null;
		month: number;
		year: number;
		isCount: boolean;
		selectedDate: string;
	};
};
export const usePhysicianDatesWithSlots = ({
	key,
	params,
}: PhysicianDatesWithSlots) => {
	return useQuery({
		queryKey: key,
		queryFn: () =>
			bookingService.getPhysicianDatesWithSlots({
				physicianId: params.physicianId!,
				month: params.month,
				year: params.year,
				isCount: params.isCount,
				selectedDate: params.selectedDate,
			}),
		enabled: !!params.physicianId,
		placeholderData: (previousData) => previousData,
	});
};

export const useCreateAvailabilityDate = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (date: string) => bookingService.createAvailabilityDate(date),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["booking", "availability-dates"],
			});
			toast({
				title: "Availability Created",
				description: "Availability date has been created successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create availability date.",
				variant: "destructive",
			});
		},
	});
};

export const useCreateSlots = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateSlotsRequest) => bookingService.createSlots(data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["booking", "availability-dates"],
			});
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "available-slots"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-availability"],
			});

			queryClient.invalidateQueries({
				queryKey: getCalculateBookingPriceKey(variables.physicianId),
			});
			toast({
				title: "Slots Created",
				description: "Time slots have been created successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create slots.",
				variant: "destructive",
			});
		},
	});
};

export const useDeleteSlot = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (slotId: string) => bookingService.deleteSlot(slotId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "available-slots"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-availability"],
			});
			toast({
				title: "Slot Deleted",
				description: "Slot has been deleted successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Deletion Failed",
				description: error.message || "Failed to delete slot.",
				variant: "destructive",
			});
		},
	});
};

export const useCalculateBookingPrice = (physicianId: string | null) => {
	return useQuery({
		queryKey: getCalculateBookingPriceKey(physicianId),
		queryFn: () => bookingService.calculateBookingPrice(physicianId!),
		enabled: !!physicianId,
	});
};

export const useUpdateSlotLocations = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			slotId,
			data,
		}: {
			slotId: string;
			data: { locationIds: string[] };
		}) => bookingService.updateSlotLocations(slotId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "available-slots"],
			});
			toast({
				title: "Locations Updated",
				description: "Slot locations have been updated successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update slot locations.",
				variant: "destructive",
			});
		},
	});
};

export const useBookSlot = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: BookSlotRequest) => bookingService.bookSlot(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["booking", "available-slots"],
			});
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "my-consultations"],
			});
			queryClient.invalidateQueries({ queryKey: getConsultationQuotasKey() });
			toast({
				title: "Slot Booked",
				description: "Your appointment has been booked successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Booking Failed",
				description: error.message || "Failed to book slot.",
				variant: "destructive",
			});
		},
	});
};

export const useMyConsultations = (
	params: { type?: "upcoming" | "past"; page?: number; limit?: number } = {},
) => {
	return useQuery({
		queryKey: [
			"booking",
			"my-consultations",
			params.type,
			params.page,
			params.limit,
		],
		queryFn: () => bookingService.getMyConsultations(params),
	});
};

export const useMarkConsultationAttended = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (bookingId: string) =>
			bookingService.markConsultationAttended(bookingId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["booking", "my-consultations"],
			});
			toast({
				title: "Success",
				description: "Consultation marked as attended.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Failed",
				description:
					error.message || "Failed to mark consultation as attended.",
				variant: "destructive",
			});
		},
	});
};

export const useDatesWithBookings = (month: number, year: number) => {
	return useQuery({
		queryKey: ["booking", "dates-with-bookings", month, year],
		queryFn: () => bookingService.getDatesWithBookings(month, year),
	});
};

export const useGenerateSlotsForDay = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: (data: {
			physicianId?: string;
			date: string;
			slotSizeId: string;
			timeZone?: string;
		}) => bookingService.generateSlotsForDay(data),
		onError: (error: any) => {
			toast({
				title: "Generation Failed",
				description: error.message || "Failed to generate slots.",
				variant: "destructive",
			});
		},
	});
};

export const useBulkDeleteSlots = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { physicianId?: string; slotIds: string[] }) =>
			bookingService.bulkDeleteSlots(data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-availability"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-bookings"],
			});

			const deletedCount = data.deleted.length;
			const failedCount = data.failed.length;

			if (failedCount > 0) {
				toast({
					title: "Partial Success",
					description: `${deletedCount} slot(s) deleted. ${failedCount} slot(s) could not be deleted (may be booked).`,
					variant: "default",
				});
			} else {
				toast({
					title: "Slots Deleted",
					description: `${deletedCount} slot(s) deleted successfully.`,
					variant: "default",
				});
			}
		},
		onError: (error: any) => {
			toast({
				title: "Deletion Failed",
				description: error.message || "Failed to delete slots.",
				variant: "destructive",
			});
		},
	});
};

export const useCreateCustomSlot = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			physicianId?: string;
			date: string;
			startTime: string;
			endTime: string;
			slotTypeIds: string[];
			locationIds?: string[];
		}) => bookingService.createCustomSlot(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "availability-dates"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-availability"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-bookings"],
			});
			toast({
				title: "Custom Slot Created",
				description: "Your custom time slot has been created successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create custom slot.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateSlot = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			slotId,
			data,
		}: {
			slotId: string;
			data: {
				startTime?: string;
				endTime?: string;
				slotTypeIds?: string[];
				locationIds?: string[];
			};
		}) => bookingService.updateSlot(slotId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["booking", "slots"] });
			queryClient.invalidateQueries({
				queryKey: ["booking", "available-slots"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-availability"],
			});
			queryClient.invalidateQueries({
				queryKey: ["booking", "dates-with-bookings"],
			});
			toast({
				title: "Slot Updated",
				description: "Slot has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update slot.",
				variant: "destructive",
			});
		},
	});
};

export const useGetMeetingLink = (bookingId: string | undefined) => {
	return useQuery({
		queryKey: ['booking', 'meeting-link', bookingId],
		queryFn: () => bookingService.getMeetingLink(bookingId!),
		enabled: !!bookingId
	})
}
