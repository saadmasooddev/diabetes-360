import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { InsertExerciseLog, healthService } from '@/services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type {  ActivityType, InsertHealthMetric, MertricRecord, MetricType } from '@shared/schema';
import { type } from 'os';



export const useLatestHealthMetric = () => {
  return useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.LATEST],
    queryFn: () => healthService.getLatestMetric(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};


export const useAggregatedStatistics = () => {
  return useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.STATISTICS],
    queryFn: () => healthService.getAggregatedStatistics(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export type FilteredMetricsKey = { endpoint: string, startDate: string, endDate: string, types: MetricType[] }
export const useFilteredMetrics = (key: FilteredMetricsKey) => {
  const { endpoint, startDate, endDate, types } = key
  return useQuery<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
    pagination: {
      bloodSugar: { total: number; limit: number; offset: number };
      waterIntake: { total: number; limit: number; offset: number };
      steps: { total: number; limit: number; offset: number };
      heartBeat: { total: number; limit: number; offset: number };
    };
  }>({
    queryKey:[key],
    queryFn: () => healthService.getFilteredMetrics(startDate!, endDate!, types),
    enabled: !!startDate && !!endDate,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useFilteredMetricsPaginated = (
  startDate: string | null,
  endDate: string | null,
  types: MetricType[] = [],
  limit: number = 30,
  offset: number = 0
) => {
  return useQuery<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
    pagination: {
      bloodSugar: { total: number; limit: number; offset: number };
      waterIntake: { total: number; limit: number; offset: number };
      steps: { total: number; limit: number; offset: number };
      heartBeat: { total: number; limit: number; offset: number };
    };
  }>({
    queryKey: [API_ENDPOINTS.HEALTH.FILTERED, startDate, endDate, types, limit, offset],
    queryFn: () => healthService.getFilteredMetrics(startDate!, endDate!, types, limit, offset),
    enabled: !!startDate && !!endDate,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};


export const useAddActivityLog = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { activityType: 'walking' | 'yoga'; hours?: number; minutes?: number }) => {
      return await healthService.addActivityLog(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity logged successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });
};




export const useAddActivityLogsBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({exercises, healthMetrics}: {exercises: Array<InsertExerciseLog>, healthMetrics?: InsertHealthMetric}) => {
      return await healthService.addActivityLogsBatch({exercises, healthMetrics});
    },
    onSuccess: (data) => {
      // Invalidate calories by activity queries (all date ranges)
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.CALORIES_BY_ACTIVITY],
      });
      queryClient.setQueryData([API_ENDPOINTS.HEALTH.LATEST], data.latestMetrics)
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.STATISTICS],
      });

      toast({
        title: "Success",
        description: "Activity logged successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });
};

// Health Metric Targets Hooks
export const useRecommendedTargets = () => {
  return useQuery<Array<{ id: string; userId: string | null; metricType: MetricType; targetValue: string }>>({
    queryKey: [API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED],
    queryFn: () => healthService.getRecommendedTargets(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};


export const useTargetsForUser = () => {
  return useQuery<{
    recommended: Array<{ id: string; userId: string | null; metricType: MetricType; targetValue: string }>;
    user: Array<{ id: string; userId: string;metricType: MetricType; targetValue: string }>;
  }>({
    queryKey: [API_ENDPOINTS.HEALTH.TARGETS.BASE],
    queryFn: () => healthService.getTargetsForUser(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};



export const useDeleteUserTarget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metricType: MetricType) => {
      return await healthService.deleteUserTarget(metricType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.USER],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.BASE],
      });
      toast({
        title: "Success",
        description: "Target deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete target",
        variant: "destructive",
      });
    },
  });
};

export const useUpsertRecommendedTargetsBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targets: Array<{metricType: MetricType; targetValue: number }>) => {
      return await healthService.upsertRecommendedTargetsBatch(targets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.BASE],
      });
      toast({
        title: "Success",
        description: "Recommended targets updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recommended targets",
        variant: "destructive",
      });
    },
  });
};

export const useUpsertUserTargetsBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targets: Array<{metricType: MetricType; targetValue: number }>) => {
      return await healthService.upsertUserTargetsBatch(targets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.USER],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.TARGETS.BASE],
      });
      toast({
        title: "Success",
        description: "Targets updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update targets",
        variant: "destructive",
      });
    },
  });
};

// Health Insights Hook
export const useHealthInsights = () => {

  return useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.INSIGHTS],
    queryFn: () => healthService.getHealthInsights(),
    refetchOnMount: false,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours - matches cache TTL
    retry: 1,
  });
};

export const useCaloriesByActivityType = (startDate: string | null, endDate: string | null) => {
  return useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.CALORIES_BY_ACTIVITY, startDate, endDate],
    queryFn: () => healthService.getCaloriesByActivityType(startDate!, endDate!),
    enabled: !!startDate && !!endDate,
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

