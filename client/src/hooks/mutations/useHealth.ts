import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { healthService } from '@/services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { HealthMetric } from '@shared/schema';

export const useHealthMetrics = (userId: string | undefined, limit: number = 30) => {
  return useQuery<HealthMetric[]>({
    queryKey: [API_ENDPOINTS.HEALTH.METRICS, userId, limit],
    queryFn: () => healthService.getMetrics(userId!, limit),
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useChartMetrics = (userId: string | undefined, days: number = 7) => {
  return useQuery<HealthMetric[]>({
    queryKey: [API_ENDPOINTS.HEALTH.CHART, userId, days],
    queryFn: () => healthService.getChartMetrics(userId!, days),
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useLatestHealthMetric = (userId: string | undefined) => {
  return useQuery<HealthMetric | null>({
    queryKey: [API_ENDPOINTS.HEALTH.LATEST, userId],
    queryFn: () => healthService.getLatestMetric(userId!),
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTodaysMetricCount = ( metricType?: 'glucose' | 'steps' | 'water') => {
  return useQuery<number>({
    queryKey: [API_ENDPOINTS.HEALTH.TODAY_COUNT, metricType],
    queryFn: () => healthService.getTodaysCount(metricType),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTodaysMetricCounts = () => {
  return useQuery<{ glucose: number; steps: number; water: number }>({
    queryKey: [API_ENDPOINTS.HEALTH.TODAY_COUNT],
    queryFn: () => healthService.getTodaysCounts(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useAddHealthMetric = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await healthService.addMetric(data);
    },
    onSuccess: () => {
      // Invalidate all health-related queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.METRICS],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.CHART],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.LATEST],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TODAY_COUNT],
      });

      toast({
        title: "Success",
        description: "Metric logged successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log metric",
        variant: "destructive",
      });
    },
  });
};

