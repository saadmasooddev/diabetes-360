import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { healthService } from '@/services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { HealthMetric, MertricRecord, ActivityLog, ExerciseLog } from '@shared/schema';

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

export const useLatestHealthMetric = () => {
  return useQuery<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric> }>({
    queryKey: [API_ENDPOINTS.HEALTH.LATEST],
    queryFn: () => healthService.getLatestMetric(),
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
    heartRate: { daily: number; weekly: number; monthly: number };
    targets: {
      recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
      user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
    };
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

// Activity Logs Hooks
export const useActivityLogs = (activityType?: 'walking' | 'yoga', limit: number = 30) => {
  return useQuery<ActivityLog[]>({
    queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.LIST, activityType, limit],
    queryFn: () => healthService.getActivityLogs(activityType, limit),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTodayActivityLogs = (activityType?: 'walking' | 'yoga') => {
  return useQuery<ActivityLog[]>({
    queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY, activityType],
    queryFn: () => healthService.getTodayActivityLogs(activityType),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTotalActivityMinutesToday = (activityType?: 'walking' | 'yoga') => {
  return useQuery<number>({
    queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY_TOTAL, activityType],
    queryFn: () => healthService.getTotalActivityMinutesToday(activityType),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useAddActivityLog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { activityType: 'walking' | 'yoga'; hours?: number; minutes?: number }) => {
      return await healthService.addActivityLog(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.ACTIVITIES.TODAY_TOTAL],
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

// Exercise Logs Hooks
export const useExerciseLogs = (exerciseType?: 'pushups' | 'squats' | 'chinups' | 'situps', limit: number = 30) => {
  return useQuery<ExerciseLog[]>({
    queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.LIST, exerciseType, limit],
    queryFn: () => healthService.getExerciseLogs(exerciseType, limit),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTodayExerciseLogs = () => {
  return useQuery<ExerciseLog[]>({
    queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.TODAY],
    queryFn: () => healthService.getTodayExerciseLogs(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTodayExerciseTotals = () => {
  return useQuery<{ pushups: number; squats: number; chinups: number; situps: number }>({
    queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.TODAY_TOTALS],
    queryFn: () => healthService.getTodayExerciseTotals(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useStrengthProgress = (days: number = 30) => {
  return useQuery<number>({
    queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.STRENGTH_PROGRESS, days],
    queryFn: () => healthService.getStrengthProgress(days),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useAddExerciseLogsBatch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercises: Array<{ exerciseType: 'pushups' | 'squats' | 'chinups' | 'situps'; count: number }>) => {
      return await healthService.addExerciseLogsBatch(exercises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.TODAY],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.TODAY_TOTALS],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ENDPOINTS.HEALTH.EXERCISES.STRENGTH_PROGRESS],
      });

      toast({
        title: "Success",
        description: "Exercises logged successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log exercises",
        variant: "destructive",
      });
    },
  });
};

// Health Metric Targets Hooks
export const useRecommendedTargets = () => {
  return useQuery<Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>>({
    queryKey: [API_ENDPOINTS.HEALTH.TARGETS.RECOMMENDED],
    queryFn: () => healthService.getRecommendedTargets(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useUserTargets = () => {
  return useQuery<Array<{ id: string; userId: string; metricType: string; targetValue: string }>>({
    queryKey: [API_ENDPOINTS.HEALTH.TARGETS.USER],
    queryFn: () => healthService.getUserTargets(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useTargetsForUser = () => {
  return useQuery<{
    recommended: Array<{ id: string; userId: string | null; metricType: string; targetValue: string }>;
    user: Array<{ id: string; userId: string; metricType: string; targetValue: string }>;
  }>({
    queryKey: [API_ENDPOINTS.HEALTH.TARGETS.BASE],
    queryFn: () => healthService.getTargetsForUser(),
    refetchOnMount: 'always',
    staleTime: 0,
  });
};

export const useUpsertRecommendedTarget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { metricType: string; targetValue: number }) => {
      return await healthService.upsertRecommendedTarget(data);
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
        description: "Recommended target updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recommended target",
        variant: "destructive",
      });
    },
  });
};

export const useUpsertUserTarget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { metricType: string; targetValue: number }) => {
      return await healthService.upsertUserTarget(data);
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
        description: "Target updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update target",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUserTarget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metricType: string) => {
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
    mutationFn: async (targets: Array<{ metricType: string; targetValue: number }>) => {
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
    mutationFn: async (targets: Array<{ metricType: string; targetValue: number }>) => {
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

