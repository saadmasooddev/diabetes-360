import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { HealthMetricCard } from '../components/HealthMetricCard';
import { HealthTrendChart } from '../components/HealthTrendChart';
import { AddMetricDialog } from '../components/AddMetricDialog';
import { LimitReachedDialog } from '../components/LimitReachedDialog';
import {
  useTodaysMetricCounts,
  useAddHealthMetric,
  useFilteredMetrics,
  useLatestHealthMetric,
  useTargetsForUser,
} from '@/hooks/mutations/useHealth';
import { formatDate } from '@/lib/utils';

export type MetricType = 'glucose' | 'steps' | 'water' | 'heartbeat';
type IntervalType = 'daily' | 'weekly' | 'monthly';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('glucose');
  const [metricValue, setMetricValue] = useState('');
  const [glucoseInterval, setGlucoseInterval] = useState<IntervalType>('daily');
  const [stepsInterval, setStepsInterval] = useState<IntervalType>('daily');
  const [waterInterval, setWaterInterval] = useState<IntervalType>('daily');
  const [heartbeatInterval, setHeartbeatInterval] = useState<IntervalType>('daily');

  const { data: todaysCounts = { glucose: 0, steps: 0, water: 0 } } = useTodaysMetricCounts();
  const { data: targets } = useTargetsForUser();
  const addMetricMutation = useAddHealthMetric();

  // Helper function to calculate date range based on interval
  const getDateRange = (interval: IntervalType): { startDate: string; endDate: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDate = today.toISOString().split('T')[0];

    const startDate = new Date();
    if (interval === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (interval === 'weekly') {
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (interval === 'monthly') {
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }
    return {
      startDate: formatDate(startDate, 'yyyy-MM-dd'),
      endDate: formatDate(new Date(endDate), 'yyyy-MM-dd')
    };
  };

  const { data: latestMetric } = useLatestHealthMetric();
  const freeTierLimits = latestMetric?.remainingLimits
  const latestBloodSugar = parseFloat(latestMetric?.current?.bloodSugar ?? '0')
  // Steps and water are now totals for today, not latest values
  const latestStepsValue = latestMetric?.current?.steps;
  const latestSteps = typeof latestStepsValue === 'number' ? latestStepsValue : (latestStepsValue ? parseInt(String(latestStepsValue)) : 0);
  const latestWaterIntakeValue = latestMetric?.current?.waterIntake;
  const latestWaterIntake = latestWaterIntakeValue ? parseFloat(String(latestWaterIntakeValue)) : 0;
  const latestHeartRate = latestMetric?.current?.heartRate ?? 0;

  const previousBloodSugar = parseFloat(latestMetric?.previous?.bloodSugar ?? '0');
  // Previous day totals for comparison
  const previousStepsValue = latestMetric?.previous?.steps;
  const previousSteps = typeof previousStepsValue === 'number' ? previousStepsValue : (previousStepsValue ? parseInt(String(previousStepsValue)) : 0);
  const previousWaterIntakeValue = latestMetric?.previous?.waterIntake;
  const previousWaterIntake = previousWaterIntakeValue ? parseFloat(String(previousWaterIntakeValue)) : 0;
  const previousHeartRate = latestMetric?.previous?.heartRate ?? 0;

  const glucoseDateRange = getDateRange(glucoseInterval);
  const { data: glucoseMetrics } = useFilteredMetrics(
    glucoseDateRange.startDate,
    glucoseDateRange.endDate,
    ['blood_sugar']
  );

  const stepsDateRange = getDateRange(stepsInterval);
  const { data: stepsMetrics } = useFilteredMetrics(
    stepsDateRange.startDate,
    stepsDateRange.endDate,
    ['steps']
  );

  const waterDateRange = getDateRange(waterInterval);
  const { data: waterMetrics } = useFilteredMetrics(
    waterDateRange.startDate,
    waterDateRange.endDate,
    ['water_intake']
  );

  const heartbeatDateRange = getDateRange(heartbeatInterval);
  const { data: heartbeatMetrics } = useFilteredMetrics(
    heartbeatDateRange.startDate,
    heartbeatDateRange.endDate,
    ['heart_beat']
  );

  const getHasReachedLimit = (metricType: MetricType): boolean => {
    if (!freeTierLimits) return false;

    const metricsRemainingLimitsMap: Record<MetricType, number> = {
      glucose: freeTierLimits.glucoseLimit,
      steps: freeTierLimits.stepsLimit,
      water: freeTierLimits.waterLimit,
      heartbeat: Infinity
    }

    return metricsRemainingLimitsMap[metricType] <= 0

  };


  const handleAddLog = (metricType: MetricType) => {
    if (getHasReachedLimit(metricType)) {
      setLimitDialogOpen(true);
      return;
    }
    setSelectedMetricType(metricType);
    setDialogOpen(true);
  };

  const handleSubmitLog = () => {
    if (!metricValue || !user?.id) return;

    const numericValue = parseFloat(metricValue);
    if (isNaN(numericValue)) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    // Validate negative values
    if (numericValue < 0) {
      toast({
        title: "Invalid Value",
        description: "Value cannot be negative",
        variant: "destructive",
      });
      return;
    }

    // Validate maximum limits for steps and water
    if (selectedMetricType === 'steps') {
      const newTotal = latestSteps + numericValue;
      if (newTotal > 20000) {
        toast({
          title: "Daily Limit Exceeded",
          description: `Adding ${numericValue} steps would exceed the daily limit of 20,000 steps. Current total: ${Math.round(newTotal)} steps.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedMetricType === 'water') {
      const newTotal = latestWaterIntake + numericValue;
      if (newTotal > 4) {
        toast({
          title: "Daily Limit Exceeded",
          description: `Adding ${numericValue}L would exceed the daily limit of 4L. Current total: ${newTotal}L.`,
          variant: "destructive",
        });
        return;
      }
    }

    const metricData: any = {
      userId: user.id,
      bloodSugar: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      heartRate: null,
      weight: null,
      steps: null,
      waterIntake: null,
    };

    if (selectedMetricType === 'glucose') {
      metricData.bloodSugar = numericValue;
    } else if (selectedMetricType === 'steps') {
      metricData.steps = numericValue;
    } else if (selectedMetricType === 'water') {
      metricData.waterIntake = numericValue;
    } else if (selectedMetricType === 'heartbeat') {
      metricData.heartRate = numericValue;
    }

    addMetricMutation.mutate(metricData, {
      onSuccess: () => {
        setDialogOpen(false);
        setMetricValue('');
        setSelectedMetricType('glucose'); // Reset to default
      },
    });
  };

  const handleUploadPicture = () => {
    toast({
      title: "Upload Picture",
      description: "Upload a picture for glucose tracking",
    });
  };

  const handleHealthAssessment = () => {
    setLocation(ROUTES.HEALTH_ASSESSMENT);
  };

  const handleUpgrade = () => {
    toast({
      title: "Upgrade to Paid Plan",
      description: "Unlock unlimited logging and premium features",
    });
  };


  const formatTimeLabel = (date: Date, interval: IntervalType): string => {
    if (interval === 'daily') {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;
    } else if (interval === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${days[date.getDay()]} ${date.getDate()}`;
    } else {
      // Monthly - show date
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // Transform metrics data for charts
  const glucoseData = useMemo(() => {
    if (!glucoseMetrics?.bloodSugarRecords?.length) return [];

    // Reverse the array so oldest is on left, newest on right
    return [...glucoseMetrics.bloodSugarRecords].reverse().map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, glucoseInterval),
        value: m.value || 0,
      };
    });
  }, [glucoseMetrics, glucoseInterval]);

  const stepsData = useMemo(() => {
    if (!stepsMetrics?.stepsRecords?.length) return [];

    // Reverse the array so oldest is on left, newest on right
    return [...stepsMetrics.stepsRecords].reverse().map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, stepsInterval),
        value: m.value as number || 0,
      };
    });
  }, [stepsMetrics, stepsInterval]);

  const waterData = useMemo(() => {
    if (!waterMetrics?.waterIntakeRecords?.length) return [];

    // Reverse the array so oldest is on left, newest on right
    return [...waterMetrics.waterIntakeRecords].reverse().map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, waterInterval),
        value: m.value || 0,
      };
    });
  }, [waterMetrics, waterInterval]);

  const heartbeatData = useMemo(() => {
    if (!heartbeatMetrics?.heartBeatRecords?.length) return [];

    // Reverse the array so oldest is on left, newest on right
    return [...heartbeatMetrics.heartBeatRecords].reverse().map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, heartbeatInterval),
        value: m.value as number || 0,
      };
    });
  }, [heartbeatMetrics, heartbeatInterval]);

  const getTrendArrow = (currentValue: number, previousValue: number) => {
    if (currentValue === 0 && previousValue === 0) return null;
    return currentValue > previousValue ?
      <ArrowUp className="ml-2 inline-block" style={{ color: '#4CAF50', width: '24px', height: '24px' }} />
      : <ArrowDown className="ml-2 inline-block" style={{ color: '#F44336', width: '24px', height: '24px' }} />;
  };

  // Helper function to get target values for a metric type
  const getTargets = (metricType: 'glucose' | 'steps' | 'water_intake' | 'heart_rate') => {
    const recommended = targets?.recommended.find(t => t.metricType === metricType);
    const user = targets?.user.find(t => t.metricType === metricType);

    return {
      recommended: recommended ? parseFloat(recommended.targetValue) : undefined,
      user: user ? parseFloat(user.targetValue) : undefined,
    };
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center" style={{ padding: '24px 16px' }}>
        <div className="w-full" style={{ maxWidth: '1200px' }}>
          {/* Welcome Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: '#00453A' }}
            >
              Health Dashboard
            </h1>
            <p
              className="text-base"
              style={{ color: '#546E7A' }}
            >
              Track your health metrics and monitor your progress
            </p>
          </div>

          {/* Metric Cards Row */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <HealthMetricCard
              type="glucose"
              latestValue={latestBloodSugar.toString()}
              trendArrow={getTrendArrow(latestBloodSugar, previousBloodSugar)}
              onAddLog={() => handleAddLog('glucose')}
              onUploadPicture={handleUploadPicture}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('glucose')}
              dailyLimit={freeTierLimits?.glucoseLimit || 0}
            />

            <HealthMetricCard
              type="steps"
              latestValue={latestSteps}
              trendArrow={getTrendArrow(latestSteps, previousSteps)}
              onAddLog={() => handleAddLog('steps')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('steps')}
              dailyLimit={freeTierLimits?.stepsLimit || 0}
            />

            <HealthMetricCard
              type="water"
              latestValue={latestWaterIntake}
              trendArrow={getTrendArrow(latestWaterIntake, previousWaterIntake)}
              onAddLog={() => handleAddLog('water')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit("water")}
              dailyLimit={freeTierLimits?.waterLimit || 0}
            />

            {/* Heart Beat Card - Only for paid users */}
            {user?.paymentType !== 'free' && user?.paymentType && (
              <HealthMetricCard
                type="heartbeat"
                latestValue={latestHeartRate.toString()}
                trendArrow={getTrendArrow(latestHeartRate, previousHeartRate)}
                onAddLog={() => handleAddLog('heartbeat')}
                onUpgrade={handleUpgrade}
                disabled={false}
                dailyLimit={0}
              />
            )}
          </div>

          {/* Health Assessment Button */}
          <div className="mb-10 flex justify-center">
            <Button
              onClick={handleHealthAssessment}
              className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #00856F 0%, #006B5C 100%)',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                padding: '16px 56px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 133, 111, 0.3)',
              }}
              data-testid="button-health-assessment"
            >
              Health Assessment
            </Button>
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            <HealthTrendChart
              title="Glucose Trend"
              data={glucoseData}
              gradientId="glucoseGradient"
              testId="card-glucose-trend"
              height={250}
              yAxisConfig={{
                domain: [0, 120],
                ticks: [0, 70, 80, 90, 100],
                label: '100mg/dL',
              }}
              interval={glucoseInterval}
              onIntervalChange={setGlucoseInterval}
              recommendedTarget={getTargets('glucose').recommended}
              userTarget={getTargets('glucose').user}
              metricType="glucose"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <HealthTrendChart
                title="Steps Walked Trend"
                data={stepsData}
                gradientId="stepsGradient"
                testId="card-steps-trend"
                height={200}
                yAxisConfig={{
                  domain: [0, 11000],
                  ticks: [0, 3000, 6000, 9000, 11000],
                }}
                interval={stepsInterval}
                onIntervalChange={setStepsInterval}
                recommendedTarget={getTargets('steps').recommended}
                userTarget={getTargets('steps').user}
                metricType="steps"
              />

              <HealthTrendChart
                title="Water Intake Trend"
                data={waterData}
                gradientId="waterGradient"
                testId="card-water-trend"
                height={200}
                yAxisConfig={{
                  domain: [0, 4],
                  ticks: [0, 1, 2, 3, 4],
                  label: '4 Litre',
                }}
                interval={waterInterval}
                onIntervalChange={setWaterInterval}
                recommendedTarget={getTargets('water_intake').recommended}
                userTarget={getTargets('water_intake').user}
                metricType="water_intake"
              />
            </div>

            {/* Heart Beat Chart - Only for paid users */}
            {user?.paymentType !== 'free' && user?.paymentType && (
              <HealthTrendChart
                title="Heart Rate Trend"
                data={heartbeatData}
                gradientId="heartbeatGradient"
                testId="card-heartbeat-trend"
                height={200}
                yAxisConfig={{
                  domain: [0, 200],
                  ticks: [0, 50, 100, 150, 200],
                  label: '200 bpm',
                }}
                interval={heartbeatInterval}
                onIntervalChange={setHeartbeatInterval}
                recommendedTarget={getTargets('heart_rate').recommended}
                userTarget={getTargets('heart_rate').user}
                metricType="heart_rate"
              />
            )}
          </div>
        </div>
      </main>

      <AddMetricDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metricType={selectedMetricType}
        value={metricValue}
        onValueChange={setMetricValue}
        onSubmit={handleSubmitLog}
        isSubmitting={addMetricMutation.isPending}
      />

    </div>
  );
}
