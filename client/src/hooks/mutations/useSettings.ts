import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/services/settingsService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { FreeTierLimits } from '@shared/schema';

export const useFreeTierLimits = () => {
  return useQuery<FreeTierLimits>({
    queryKey: [API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS],
    queryFn: () => settingsService.getFreeTierLimits(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useCreateFreeTierLimits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { glucoseLimit: number; stepsLimit: number; waterLimit: number }) => {
      return await settingsService.createFreeTierLimits(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS],
      });

      toast({
        title: "Success",
        description: "Free tier limits created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create free tier limits",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFreeTierLimits = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<{ glucoseLimit: number; stepsLimit: number; waterLimit: number }>) => {
      return await settingsService.updateFreeTierLimits(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.SETTINGS.FREE_TIER_LIMITS],
      });

      toast({
        title: "Success",
        description: "Free tier limits updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update free tier limits",
        variant: "destructive",
      });
    },
  });
};

