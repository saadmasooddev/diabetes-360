import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { foodScannerService } from '@/services/foodScannerService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { ScanResult } from '@/mocks/scanResults';

export const useScanFood = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ScanResult & { can_scan_food?: boolean; remaining_scans?: number }, Error, File>({
    mutationFn: (file: File) => foodScannerService.scanFoodImage(file),
    onSuccess: () => {
      // Invalidate scan status to refetch after successful scan
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.SETTINGS.FOOD_SCAN_STATUS],
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

