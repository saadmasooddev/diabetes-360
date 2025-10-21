import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { HealthMetric } from '@shared/schema';
import { format, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsListProps {
  data: HealthMetric[];
  metricType: string;
  unit: string;
  timeRange: string;
}

export function MetricsList({ data, metricType, unit, timeRange }: MetricsListProps) {
  const filteredData = useMemo(() => {
    let filtered = [...data];
    const now = new Date();

    if (timeRange === '7d') {
      const cutoff = subDays(now, 7);
      filtered = data.filter(d => new Date(d.recordedAt) >= cutoff);
    } else if (timeRange === '30d') {
      const cutoff = subDays(now, 30);
      filtered = data.filter(d => new Date(d.recordedAt) >= cutoff);
    } else if (timeRange === '90d') {
      const cutoff = subDays(now, 90);
      filtered = data.filter(d => new Date(d.recordedAt) >= cutoff);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    return filtered;
  }, [data, timeRange]);

  const getMetricValue = (item: HealthMetric) => {
    switch (metricType) {
      case 'bloodSugar':
        return item.bloodSugar ? `${item.bloodSugar} ${unit}` : null;
      case 'bloodPressure':
        return item.bloodPressureSystolic && item.bloodPressureDiastolic
          ? `${item.bloodPressureSystolic}/${item.bloodPressureDiastolic} ${unit}`
          : null;
      case 'heartRate':
        return item.heartRate ? `${item.heartRate} ${unit}` : null;
      case 'weight':
        return item.weight ? `${item.weight} ${unit}` : null;
      case 'steps':
        return item.steps ? `${item.steps.toLocaleString()} ${unit}` : null;
      default:
        return null;
    }
  };

  const getTrend = (index: number): 'up' | 'down' | 'same' | null => {
    if (index >= filteredData.length - 1) return null;

    const current = filteredData[index];
    const previous = filteredData[index + 1];

    let currentValue: number | null = null;
    let previousValue: number | null = null;

    switch (metricType) {
      case 'bloodSugar':
        currentValue = current.bloodSugar ? parseFloat(current.bloodSugar) : null;
        previousValue = previous.bloodSugar ? parseFloat(previous.bloodSugar) : null;
        break;
      case 'bloodPressure':
        currentValue = current.bloodPressureSystolic;
        previousValue = previous.bloodPressureSystolic;
        break;
      case 'heartRate':
        currentValue = current.heartRate;
        previousValue = previous.heartRate;
        break;
      case 'weight':
        currentValue = current.weight ? parseFloat(current.weight) : null;
        previousValue = previous.weight ? parseFloat(previous.weight) : null;
        break;
      case 'steps':
        currentValue = current.steps;
        previousValue = previous.steps;
        break;
    }

    if (currentValue === null || previousValue === null) return null;

    if (currentValue > previousValue) return 'up';
    if (currentValue < previousValue) return 'down';
    return 'same';
  };

  const relevantData = filteredData.filter(item => getMetricValue(item) !== null);

  if (relevantData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No data available for the selected time range
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {relevantData.map((item, index) => {
        const value = getMetricValue(item);
        const trend = getTrend(index);

        return (
          <Card key={item.id} data-testid={`metric-item-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(item.recordedAt), 'MMMM dd, yyyy')}
                    </p>
                    <span className="text-xs text-gray-400">
                      {format(new Date(item.recordedAt), 'hh:mm a')}
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {value}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {trend === 'up' && (
                    <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                      <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  {trend === 'down' && (
                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                      <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {trend === 'same' && (
                    <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                      <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
