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
  useHealthMetrics,
  useChartMetrics,
  useTodaysMetricCounts,
  useAddHealthMetric,
  useFilteredMetrics,
} from '@/hooks/mutations/useHealth';
import { useFreeTierLimits } from '@/hooks/mutations/useSettings';
import { MertricRecord } from '@shared/schema';

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
  const { data: freeTierLimits } = useFreeTierLimits();
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
      startDate: startDate.toISOString().split('T')[0],
      endDate,
    };
  };

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

  const isFreeUser = user?.tier === 'free' || !user?.tier;

  const getHasReachedLimit = (metricType: MetricType): boolean => {
    if (!isFreeUser || !freeTierLimits) return false;

    const limit = metricType === 'glucose'
      ? freeTierLimits.glucoseLimit
      : metricType === 'steps'
        ? freeTierLimits.stepsLimit
        : freeTierLimits.waterLimit;

    const count = metricType === 'glucose'
      ? todaysCounts.glucose
      : metricType === 'steps'
        ? todaysCounts.steps
        : todaysCounts.water;

    return count >= limit;
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
      metricData.bloodSugar = numericValue.toString();
    } else if (selectedMetricType === 'steps') {
      metricData.steps = Math.round(numericValue);
    } else if (selectedMetricType === 'water') {
      metricData.waterIntake = numericValue.toString();
    } else if (selectedMetricType === 'heartbeat') {
      metricData.heartRate = Math.round(numericValue);
    }

    addMetricMutation.mutate(metricData, {
      onSuccess: () => {
        setDialogOpen(false);
        setMetricValue('');
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

    return glucoseMetrics.bloodSugarRecords.map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, glucoseInterval),
        value: parseFloat(m.value as string || '0'),
      };
    });
  }, [glucoseMetrics, glucoseInterval]);

  const stepsData = useMemo(() => {
    if (!stepsMetrics?.stepsRecords?.length) return [];

    return stepsMetrics.stepsRecords.map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, stepsInterval),
        value: m.value as number || 0,
      };
    });
  }, [stepsMetrics, stepsInterval]);

  const waterData = useMemo(() => {
    if (!waterMetrics?.waterIntakeRecords?.length) return [];

    return waterMetrics.waterIntakeRecords.map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, waterInterval),
        value: parseFloat(m.value as string || '0'),
      };
    });
  }, [waterMetrics, waterInterval]);

  const heartbeatData = useMemo(() => {
    if (!heartbeatMetrics?.heartBeatRecords?.length) return [];

    return heartbeatMetrics.heartBeatRecords.map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, heartbeatInterval),
        value: m.value as number || 0,
      };
    });
  }, [heartbeatMetrics, heartbeatInterval]);

  const getTrendArrow = (metrics: MertricRecord[]) => {
    if (!metrics?.length) return null;
    const currentValue = metrics[0]?.value as number || 0;
    const previousValue = metrics[1]?.value as number || 0;
    return currentValue > previousValue ?
      <ArrowUp className="ml-2 inline-block" style={{ color: '#4CAF50', width: '24px', height: '24px' }} />
      : <ArrowDown className="ml-2 inline-block" style={{ color: '#F44336', width: '24px', height: '24px' }} />;
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center" style={{ padding: '32px' }}>
        <div className="w-full" style={{ maxWidth: '1145px' }}>
          {/* Metric Cards Row */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            <HealthMetricCard
              type="glucose"
              latestValue={glucoseMetrics?.bloodSugarRecords[0]?.value as string || '0'}
              trendArrow={getTrendArrow(glucoseMetrics?.bloodSugarRecords || [])}
              onAddLog={() => handleAddLog('glucose')}
              onUploadPicture={handleUploadPicture}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('glucose')}
              dailyLimit={freeTierLimits?.glucoseLimit ?? 2}
            />

            <HealthMetricCard
              type="steps"
              latestValue={stepsMetrics?.stepsRecords[0]?.value as number || 0}
              trendArrow={getTrendArrow(stepsMetrics?.stepsRecords || [])}
              onAddLog={() => handleAddLog('steps')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('steps')}
              dailyLimit={freeTierLimits?.stepsLimit ?? 2}
            />

            <HealthMetricCard
              type="water"
              latestValue={waterMetrics?.waterIntakeRecords[0]?.value as string || '0'}
              trendArrow={getTrendArrow(waterMetrics?.waterIntakeRecords || [])}
              onAddLog={() => handleAddLog('water')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('water')}
              dailyLimit={freeTierLimits?.waterLimit ?? 2}
            />

            {/* Heart Beat Card - Only for paid users */}
            {user?.tier === 'paid' && (
              <HealthMetricCard
                type="heartbeat"
                latestValue={heartbeatMetrics?.heartBeatRecords[0]?.value as number || 0}
                trendArrow={getTrendArrow(heartbeatMetrics?.heartBeatRecords || [])}
                onAddLog={() => handleAddLog('heartbeat')}
                onUpgrade={handleUpgrade}
                disabled={false}
                dailyLimit={0}
              />
            )}
          </div>

          {/* Health Assessment Button */}
          <div className="mb-8 flex justify-center">
            <Button
              onClick={handleHealthAssessment}
              style={{
                background: '#00856F',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                padding: '14px 48px',
                border: 'none',
              }}
              data-testid="button-health-assessment"
            >
              Health Assessment
            </Button>
          </div>

          {/* Charts Section */}
          <div className="space-y-8">
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
              />
            </div>

            {/* Heart Beat Chart - Only for paid users */}
            {user?.tier === 'paid' && (
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

      <LimitReachedDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
