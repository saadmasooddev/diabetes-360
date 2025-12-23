import { useState, useMemo } from 'react';
import { HealthTrendChart } from './HealthTrendChart';
import { useFilteredMetrics } from '@/hooks/mutations/useHealth';
import { useTargetsForUser } from '@/hooks/mutations/useHealth';
import { formatDate } from '@/lib/utils';
import { EXERCISE_TYPE_ENUM } from '@shared/schema';

type IntervalType = 'daily' | 'weekly' | 'monthly';

export function GlucoseChartSection() {
  const [interval, setInterval] = useState<IntervalType>('daily');
  const { data: targets } = useTargetsForUser();

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

  const dateRange = getDateRange(interval);
  const { data: glucoseMetrics, isLoading } = useFilteredMetrics(
    dateRange.startDate,
    dateRange.endDate,
    [EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE]
  );

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
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const glucoseData = useMemo(() => {
    if (!glucoseMetrics?.bloodSugarRecords?.length) return [];

    return [...glucoseMetrics.bloodSugarRecords].reverse().map(m => {
      const date = new Date(m.recordedAt);
      return {
        time: formatTimeLabel(date, interval),
        value: m.value || 0,
      };
    });
  }, [glucoseMetrics, interval]);

  const getTargets = () => {
    const recommended = targets?.recommended.find(t => t.metricType === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE);
    const user = targets?.user.find(t => t.metricType === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE);

    return {
      recommended: recommended ? parseFloat(recommended.targetValue) : undefined,
      user: user ? parseFloat(user.targetValue) : undefined,
    };
  };

  const targetValues = getTargets();

  return (
    <HealthTrendChart
      title="Glucose Logs"
      data={glucoseData}
      gradientId="glucoseGradient"
      testId="chart-glucose-logs"
      height={250}
      yAxisConfig={{
        domain: [0, 200],
        ticks: [0, 50, 100, 150, 200],
        label: 'mg/dL',
      }}
      interval={interval}
      onIntervalChange={setInterval}
      recommendedTarget={targetValues.recommended}
      userTarget={targetValues.user}
    />
  );
}
