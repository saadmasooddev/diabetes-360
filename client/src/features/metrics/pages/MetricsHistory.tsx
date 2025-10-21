import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { healthService } from '@/features/dashboard/services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { MetricsChart } from '../components/MetricsChart.tsx';
import { MetricsList } from '../components/MetricsList.tsx';

type MetricType = 'bloodSugar' | 'bloodPressure' | 'heartRate' | 'weight' | 'steps';
type TimeRange = '7d' | '30d' | '90d' | 'all';

const metricOptions = [
  { value: 'bloodSugar', label: 'Blood Sugar', unit: 'mg/dL' },
  { value: 'bloodPressure', label: 'Blood Pressure', unit: 'mmHg' },
  { value: 'heartRate', label: 'Heart Rate', unit: 'bpm' },
  { value: 'weight', label: 'Weight', unit: 'kg' },
  { value: 'steps', label: 'Steps', unit: 'steps' },
];

export function MetricsHistory() {
  const [, setLocation] = useLocation();
  const user = useAuthStore((state) => state.user);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('bloodSugar');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: metrics, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.METRICS, user?.id, 100],
    queryFn: () => healthService.getMetrics(user?.id || '', 100),
    enabled: !!user?.id,
  });

  const selectedMetricData = metricOptions.find(m => m.value === selectedMetric);

  // Filter metrics based on selected metric type
  const filteredMetrics = useMemo(() => {
    if (!metrics) return [];
    
    return metrics.filter(metric => {
      switch (selectedMetric) {
        case 'bloodSugar':
          return metric.bloodSugar !== null;
        case 'bloodPressure':
          return metric.bloodPressureSystolic !== null && metric.bloodPressureDiastolic !== null;
        case 'heartRate':
          return metric.heartRate !== null;
        case 'weight':
          return metric.weight !== null;
        case 'steps':
          return metric.steps !== null;
        default:
          return false;
      }
    });
  }, [metrics, selectedMetric]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(ROUTES.DASHBOARD)}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Health Metrics
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your health trends over time
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Metric
              </label>
              <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                <SelectTrigger data-testid="select-metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Data View */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" data-testid="tab-chart">
              <TrendingUp className="mr-2 h-4 w-4" />
              Chart View
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <Calendar className="mr-2 h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMetricData?.label} Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : filteredMetrics.length > 0 ? (
                  <MetricsChart
                    data={filteredMetrics}
                    metricType={selectedMetric}
                    unit={selectedMetricData?.unit || ''}
                    timeRange={timeRange}
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-gray-500">
                    No data available for the selected metric
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredMetrics.length > 0 ? (
              <MetricsList
                data={filteredMetrics}
                metricType={selectedMetric}
                unit={selectedMetricData?.unit || ''}
                timeRange={timeRange}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    No data available for the selected metric
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
