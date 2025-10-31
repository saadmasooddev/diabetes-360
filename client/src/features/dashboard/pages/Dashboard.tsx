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
} from '@/hooks/mutations/useHealth';
import { useFreeTierLimits } from '@/hooks/mutations/useSettings';

type MetricType = 'glucose' | 'steps' | 'water';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('glucose');
  const [metricValue, setMetricValue] = useState('');

  // Fetch all metrics to get latest value for each type
  const { data: allMetrics = [] } = useHealthMetrics(user?.id, 30);
  const { data: chartMetrics = [] } = useChartMetrics(user?.id, 7);
  const { data: todaysCounts = { glucose: 0, steps: 0, water: 0 } } = useTodaysMetricCounts();
  const { data: freeTierLimits } = useFreeTierLimits();
  const addMetricMutation = useAddHealthMetric();

  // Check if user has reached daily limit per metric type
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

  // Get latest values for each metric type (sorted by most recent first)
  const latestValues = useMemo(() => {
    // Sort metrics by recordedAt descending (most recent first)
    const sortedMetrics = [...allMetrics].sort((a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    const glucose = sortedMetrics.find((m) => m.bloodSugar)?.bloodSugar || null;
    const steps = sortedMetrics.find((m) => m.steps !== null && m.steps !== undefined)?.steps || null;
    const water = sortedMetrics.find((m) => m.waterIntake)?.waterIntake || null;
    return { glucose, steps, water };
  }, [allMetrics]);

  // Get previous values for trend arrows (sorted by most recent first)
  const previousMetrics = useMemo(() => {
    return [...allMetrics]
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, 10); // Get first 10 most recent for comparison
  }, [allMetrics]);

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

  const getTrendArrow = (metricType: MetricType) => {
    if (!previousMetrics || previousMetrics.length < 2) return null;

    let currentValue: number | null = null;
    let previousValue: number | null = null;

    if (metricType === 'glucose') {
      currentValue = latestValues.glucose ? parseFloat(latestValues.glucose) : null;
      // Find the second most recent glucose value (skip the first/latest one)
      const previous = previousMetrics.slice(1).find((m) => m.bloodSugar);
      previousValue = previous?.bloodSugar ? parseFloat(previous.bloodSugar) : null;
    } else if (metricType === 'steps') {
      currentValue = latestValues.steps;
      // Find the second most recent steps value (skip the first/latest one)
      const previous = previousMetrics.slice(1).find((m) => m.steps !== null && m.steps !== undefined);
      previousValue = previous?.steps || null;
    } else if (metricType === 'water') {
      currentValue = latestValues.water ? parseFloat(latestValues.water) : null;
      // Find the second most recent water value (skip the first/latest one)
      const previous = previousMetrics.slice(1).find((m) => m.waterIntake);
      previousValue = previous?.waterIntake ? parseFloat(previous.waterIntake) : null;
    }

    if (currentValue === null || previousValue === null) return null;

    const isIncreasing = currentValue > previousValue;
    return isIncreasing ? (
      <ArrowUp className="ml-2 inline-block" style={{ color: '#4CAF50', width: '24px', height: '24px' }} />
    ) : (
      <ArrowDown className="ml-2 inline-block" style={{ color: '#F44336', width: '24px', height: '24px' }} />
    );
  };

  // Transform metrics data for charts
  const glucoseData = useMemo(() => {
    if (!chartMetrics.length) return [];

    return chartMetrics
      .filter(m => m.bloodSugar)
      .map(m => {
        const date = new Date(m.recordedAt);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const timeLabel = `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;

        return {
          time: timeLabel,
          value: parseFloat(m.bloodSugar || '0'),
        };
      });
  }, [chartMetrics]);

  const stepsData = useMemo(() => {
    if (!chartMetrics.length) return [];

    return chartMetrics
      .filter(m => m.steps)
      .map(m => {
        const date = new Date(m.recordedAt);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const timeLabel = `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;

        return {
          time: timeLabel,
          value: m.steps || 0,
        };
      });
  }, [chartMetrics]);

  const waterData = useMemo(() => {
    if (!chartMetrics.length) return [];

    return chartMetrics
      .filter(m => m.waterIntake)
      .map(m => {
        const date = new Date(m.recordedAt);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const timeLabel = `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;

        return {
          time: timeLabel,
          value: parseFloat(m.waterIntake || '0'),
        };
      });
  }, [chartMetrics]);

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center" style={{ padding: '32px' }}>
        <div className="w-full" style={{ maxWidth: '1145px' }}>
          {/* Metric Cards Row */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <HealthMetricCard
              type="glucose"
              latestValue={latestValues.glucose}
              trendArrow={getTrendArrow('glucose')}
              onAddLog={() => handleAddLog('glucose')}
              onUploadPicture={handleUploadPicture}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('glucose')}
              dailyLimit={freeTierLimits?.glucoseLimit ?? 2}
            />

            <HealthMetricCard
              type="steps"
              latestValue={latestValues.steps}
              trendArrow={getTrendArrow('steps')}
              onAddLog={() => handleAddLog('steps')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('steps')}
              dailyLimit={freeTierLimits?.stepsLimit ?? 2}
            />

            <HealthMetricCard
              type="water"
              latestValue={latestValues.water}
              trendArrow={getTrendArrow('water')}
              onAddLog={() => handleAddLog('water')}
              onUpgrade={handleUpgrade}
              disabled={getHasReachedLimit('water')}
              dailyLimit={freeTierLimits?.waterLimit ?? 2}
            />
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
              />
            </div>
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
