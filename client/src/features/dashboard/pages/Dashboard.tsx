import { useState } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_ENDPOINTS } from '@/config/endpoints';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { HealthMetric } from '@shared/schema';

const glucoseData = [
  { time: '7 AM', value: 85 },
  { time: '9 AM', value: 95 },
  { time: '11 AM', value: 110 },
  { time: '12 PM', value: 105 },
  { time: '2 PM', value: 90 },
  { time: '4 PM', value: 115 },
  { time: '6 PM', value: 108 },
];

const stepsData = [
  { time: '7 AM', value: 500 },
  { time: '9 AM', value: 2500 },
  { time: '11 AM', value: 5000 },
  { time: '12 PM', value: 6200 },
  { time: '2 PM', value: 4800 },
  { time: '4 PM', value: 8000 },
  { time: '6 PM', value: 10200 },
];

const waterData = [
  { time: '7 AM', value: 0.5 },
  { time: '9 AM', value: 1.2 },
  { time: '11 AM', value: 2.0 },
  { time: '12 PM', value: 2.5 },
  { time: '2 PM', value: 2.8 },
  { time: '4 PM', value: 3.5 },
  { time: '6 PM', value: 3.8 },
];

type MetricType = 'glucose' | 'steps' | 'water';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('glucose');
  const [metricValue, setMetricValue] = useState('');

  const { data: latestMetrics } = useQuery<HealthMetric | null>({
    queryKey: [`${API_ENDPOINTS.HEALTH.LATEST}?userId=${user?.id}`],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: previousMetrics } = useQuery<HealthMetric[]>({
    queryKey: [`${API_ENDPOINTS.HEALTH.METRICS}?userId=${user?.id}&limit=5`],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const addMetricMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', API_ENDPOINTS.HEALTH.ADD, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description: "Metric logged successfully",
      });
      setDialogOpen(false);
      setMetricValue('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log metric",
        variant: "destructive",
      });
    },
  });

  const handleAddLog = (metricType: MetricType) => {
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

    addMetricMutation.mutate(metricData);
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
    if (!latestMetrics || !previousMetrics || previousMetrics.length < 2) return null;

    let currentValue: number | null = null;
    let previousValue: number | null = null;

    if (metricType === 'glucose') {
      currentValue = latestMetrics.bloodSugar ? parseFloat(latestMetrics.bloodSugar) : null;
      const previous = previousMetrics.find((m, i) => i > 0 && m.bloodSugar);
      previousValue = previous?.bloodSugar ? parseFloat(previous.bloodSugar) : null;
    } else if (metricType === 'steps') {
      currentValue = latestMetrics.steps || null;
      const previous = previousMetrics.find((m, i) => i > 0 && m.steps);
      previousValue = previous?.steps || null;
    } else if (metricType === 'water') {
      currentValue = latestMetrics.waterIntake ? parseFloat(latestMetrics.waterIntake) : null;
      const previous = previousMetrics.find((m, i) => i > 0 && m.waterIntake);
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

  const formatGlucoseValue = () => {
    if (!latestMetrics?.bloodSugar) return '—';
    return latestMetrics.bloodSugar;
  };

  const formatStepsValue = () => {
    if (!latestMetrics?.steps) return '—';
    return latestMetrics.steps.toLocaleString();
  };

  const formatWaterValue = () => {
    if (!latestMetrics?.waterIntake) return '—';
    return parseFloat(latestMetrics.waterIntake).toFixed(1);
  };

  const getDialogTitle = () => {
    if (selectedMetricType === 'glucose') return 'Log Glucose';
    if (selectedMetricType === 'steps') return 'Log Steps';
    return 'Log Water Intake';
  };

  const getDialogPlaceholder = () => {
    if (selectedMetricType === 'glucose') return 'Enter glucose level (mg/dL)';
    if (selectedMetricType === 'steps') return 'Enter steps count';
    return 'Enter water intake (L)';
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />
      
      <main className="flex-1 flex justify-center" style={{ padding: '32px' }}>
        <div className="w-full" style={{ maxWidth: '1145px' }}>
          {/* Metric Cards Row */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Current Glucose Card */}
            <Card
              className="overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}
              data-testid="card-current-glucose"
            >
              <h3
                className="mb-4 font-semibold"
                style={{
                  color: '#00453A',
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: 600,
                }}
              >
                Current Glucose
              </h3>
              <div className="mb-6 flex items-center" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>{formatGlucoseValue()}</span>
                <span style={{ fontSize: '16px', marginLeft: '4px' }}>mg/dL</span>
                {getTrendArrow('glucose')}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddLog('glucose')}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1px solid #00856F',
                    borderRadius: '8px',
                    color: '#00856F',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '10px 16px',
                  }}
                  data-testid="button-add-glucose-log"
                >
                  Add New Log
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUploadPicture}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1px solid #00856F',
                    borderRadius: '8px',
                    color: '#00856F',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '10px 16px',
                  }}
                  data-testid="button-upload-picture"
                >
                  Upload Picture
                </Button>
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: '#546E7A', fontSize: '12px', lineHeight: '16px' }}
              >
                *limited to 2 logs per day.{' '}
                <button
                  onClick={handleUpgrade}
                  style={{ color: '#00856F', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  data-testid="link-upgrade-glucose"
                >
                  Upgrade to Paid Plan
                </button>
              </p>
            </Card>

            {/* Steps Walked Card */}
            <Card
              className="overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}
              data-testid="card-steps-walked"
            >
              <h3
                className="mb-4 font-semibold"
                style={{
                  color: '#00453A',
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: 600,
                }}
              >
                Steps Walked
              </h3>
              <div className="mb-6 flex items-center" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>{formatStepsValue()}</span>
                <span style={{ fontSize: '16px', marginLeft: '4px' }}>steps</span>
                {getTrendArrow('steps')}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddLog('steps')}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #00856F',
                    borderRadius: '8px',
                    color: '#00856F',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '10px 16px',
                  }}
                  data-testid="button-add-steps-log"
                >
                  Add New Log
                </Button>
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: '#546E7A', fontSize: '12px', lineHeight: '16px' }}
              >
                *limited to 2 logs per day.{' '}
                <button
                  onClick={handleUpgrade}
                  style={{ color: '#00856F', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  data-testid="link-upgrade-steps"
                >
                  Upgrade to Paid Plan
                </button>
              </p>
            </Card>

            {/* Water Intake Card */}
            <Card
              className="overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}
              data-testid="card-water-intake"
            >
              <h3
                className="mb-4 font-semibold"
                style={{
                  color: '#00453A',
                  fontSize: '18px',
                  lineHeight: '24px',
                  fontWeight: 600,
                }}
              >
                Water Intake
              </h3>
              <div className="mb-6 flex items-center" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>{formatWaterValue()}</span>
                <span style={{ fontSize: '16px', marginLeft: '4px' }}>L</span>
                {getTrendArrow('water')}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddLog('water')}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #00856F',
                    borderRadius: '8px',
                    color: '#00856F',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '10px 16px',
                  }}
                  data-testid="button-add-water-log"
                >
                  Add New Log
                </Button>
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: '#546E7A', fontSize: '12px', lineHeight: '16px' }}
              >
                *limited to 2 logs per day.{' '}
                <button
                  onClick={handleUpgrade}
                  style={{ color: '#00856F', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  data-testid="link-upgrade-water"
                >
                  Upgrade to Paid Plan
                </button>
              </p>
            </Card>
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
            {/* Glucose Trend Chart */}
            <Card
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}
              data-testid="card-glucose-trend"
            >
              <h3
                className="mb-6 font-semibold"
                style={{
                  color: '#00453A',
                  fontSize: '20px',
                  lineHeight: '28px',
                  fontWeight: 600,
                }}
              >
                Glucose Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={glucoseData}>
                  <defs>
                    <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00856F" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00856F" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#546E7A', fontSize: 12 }}
                    axisLine={{ stroke: '#E0E0E0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#546E7A', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 120]}
                    ticks={[0, 70, 80, 90, 100]}
                    label={{ value: '100mg/dL', position: 'insideLeft', fill: '#546E7A', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00856F"
                    strokeWidth={2}
                    fill="url(#glucoseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Steps and Water Charts Side by Side */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Steps Walked Trend */}
              <Card
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                }}
                data-testid="card-steps-trend"
              >
                <h3
                  className="mb-6 font-semibold"
                  style={{
                    color: '#00453A',
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: 600,
                  }}
                >
                  Steps Walked Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stepsData}>
                    <defs>
                      <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00856F" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00856F" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#546E7A', fontSize: 12 }}
                      axisLine={{ stroke: '#E0E0E0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#546E7A', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 11000]}
                      ticks={[0, 3000, 6000, 9000, 11000]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#00856F"
                      strokeWidth={2}
                      fill="url(#stepsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Water Intake Trend */}
              <Card
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                }}
                data-testid="card-water-trend"
              >
                <h3
                  className="mb-6 font-semibold"
                  style={{
                    color: '#00453A',
                    fontSize: '20px',
                    lineHeight: '28px',
                    fontWeight: 600,
                  }}
                >
                  Water Intake Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={waterData}>
                    <defs>
                      <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00856F" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00856F" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#546E7A', fontSize: 12 }}
                      axisLine={{ stroke: '#E0E0E0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#546E7A', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 4]}
                      ticks={[0, 1, 2, 3, 4]}
                      label={{ value: '4 Litre', position: 'insideTopLeft', fill: '#546E7A', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#00856F"
                      strokeWidth={2}
                      fill="url(#waterGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Add Metric Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="sm:max-w-md"
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#00453A', fontSize: '20px', fontWeight: 600 }}>
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metric-value" style={{ color: '#00453A', fontSize: '14px', fontWeight: 500 }}>
                Value
              </Label>
              <Input
                id="metric-value"
                type="number"
                placeholder={getDialogPlaceholder()}
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                style={{
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                }}
                data-testid="input-metric-value"
              />
            </div>
            <Button
              onClick={handleSubmitLog}
              disabled={addMetricMutation.isPending}
              style={{
                width: '100%',
                background: '#00856F',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                padding: '12px',
                border: 'none',
              }}
              data-testid="button-log-now"
            >
              {addMetricMutation.isPending ? 'Logging...' : 'Log Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
