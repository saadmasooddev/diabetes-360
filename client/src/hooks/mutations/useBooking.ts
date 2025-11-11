import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService, type CreateSlotsRequest, type BookSlotRequest, type UpdateSlotPriceRequest, type UpdateSlotLocationsRequest } from '@/services/bookingService';
import { useToast } from '@/hooks/use-toast';

export const useSlotSizes = () => {
  return useQuery({
    queryKey: ['booking', 'slot-sizes'],
    queryFn: () => bookingService.getSlotSizes(),
  });
};

export const useSlotTypes = () => {
  return useQuery({
    queryKey: ['booking', 'slot-types'],
    queryFn: () => bookingService.getSlotTypes(),
  });
};

export const useAvailabilityDates = () => {
  return useQuery({
    queryKey: ['booking', 'availability-dates'],
    queryFn: () => bookingService.getAvailabilityDates(),
  });
};

export const useDatesWithAvailability = (physicianId: string | null) => {
  return useQuery({
    queryKey: ['booking', 'dates-with-availability', physicianId],
    queryFn: () => bookingService.getDatesWithAvailability(physicianId!),
    enabled: !!physicianId,
  });
};

export const useSlotsForDate = (physicianId: string | null, date: string | null) => {
  return useQuery({
    queryKey: ['booking', 'slots', physicianId, date],
    queryFn: () => bookingService.getSlotsForDate(physicianId!, date!),
    enabled: !!physicianId && !!date,
  });
};

export const useAvailableSlotsForDate = (physicianId: string | null, date: string | null) => {
  return useQuery({
    queryKey: ['booking', 'available-slots', physicianId, date],
    queryFn: () => bookingService.getAvailableSlotsForDate(physicianId!, date!),
    enabled: !!physicianId && !!date,
  });
};

export const useCreateAvailabilityDate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => bookingService.createAvailabilityDate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability-dates'] });
      toast({
        title: 'Availability Created',
        description: 'Availability date has been created successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create availability date.',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability-dates'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'dates-with-availability'] });
      toast({
        title: 'Slots Created',
        description: 'Time slots have been created successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create slots.',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'dates-with-availability'] });
      toast({
        title: 'Slot Deleted',
        description: 'Slot has been deleted successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete slot.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSlotPrice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ priceId, data }: { priceId: string; data: UpdateSlotPriceRequest }) =>
      bookingService.updateSlotPrice(priceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'available-slots'] });
      toast({
        title: 'Price Updated',
        description: 'Slot price has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update slot price.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSlotLocations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: { locationIds: string[] } }) =>
      bookingService.updateSlotLocations(slotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'available-slots'] });
      toast({
        title: 'Locations Updated',
        description: 'Slot locations have been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update slot locations.',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['booking', 'available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['booking', 'slots'] });
      toast({
        title: 'Slot Booked',
        description: 'Your appointment has been booked successfully.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to book slot.',
        variant: 'destructive',
      });
    },
  });
};

