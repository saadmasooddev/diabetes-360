import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { foodScannerService } from '@/services/foodScannerService';
import type { ScanResult } from '@/mocks/scanResults';

export const useScanFood = () => {
  const { toast } = useToast();

  return useMutation<ScanResult, Error, File>({
    mutationFn: (file: File) => foodScannerService.scanFoodImage(file),
    onError: (error) => {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan food image. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

