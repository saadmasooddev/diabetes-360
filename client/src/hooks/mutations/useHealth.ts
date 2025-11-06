import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { healthService } from '@/services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { HealthMetric, MertricRecord } from '@shared/schema';

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

export const useAggregatedStatistics = () => {
  return useQuery<{
    glucose: { daily: number; weekly: number; monthly: number };
    water: { daily: number; weekly: number; monthly: number };
    steps: { daily: number; weekly: number; monthly: number };
  }>({
    queryKey: [API_ENDPOINTS.HEALTH.STATISTICS],
    queryFn: () => healthService.getAggregatedStatistics(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useFilteredMetrics = (
  startDate: string | null,
  endDate: string | null,
  types: string[] = []
) => {
  return useQuery<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
  }>({
    queryKey: [API_ENDPOINTS.HEALTH.FILTERED, startDate, endDate, types],
    queryFn: () => healthService.getFilteredMetrics(startDate!, endDate!, types),
    enabled: !!startDate && !!endDate,
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
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.STATISTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.FILTERED],
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

