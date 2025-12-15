import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { foodScannerService, type DailyUserData, type ConsumedNutrients } from '@/services/foodScannerService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { ScanResult } from '@/mocks/scanResults';

export const useScanFood = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ScanResult & { can_scan_food?: boolean; remaining_scans?: number }, Error, File>({
    mutationFn: (file: File) => foodScannerService.scanFoodImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.SETTINGS.FOOD_SCAN_STATUS],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.FOOD_SCANNER.NUTRITION_CONSUMED],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan food image. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useConsumedNutrients = () => {
  return useQuery<ConsumedNutrients | null, Error>({
    queryKey: [API_ENDPOINTS.FOOD_SCANNER.NUTRITION_CONSUMED],
    queryFn: () => foodScannerService.getConsumedNutrients(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

// Utility function to calculate milliseconds until midnight
const getMillisecondsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

// Hook for daily nutrition requirements - fetches once per day, cached until midnight
export const useUserDailyData = () => {
  const { toast } = useToast();
  const msUntilMidnight = getMillisecondsUntilMidnight();

  return useQuery<DailyUserData, Error>({
    queryKey: [API_ENDPOINTS.FOOD_SCANNER.DAILY_DATA, 'daily'],
    queryFn: () => foodScannerService.getNutritionRequirements(),
    staleTime: msUntilMidnight, 
    gcTime: msUntilMidnight, 
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};


