import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { healthService } from '../services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

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

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const { data: latestMetrics } = useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.LATEST, user?.id],
    queryFn: () => healthService.getLatestMetrics(user?.id || ''),
    enabled: !!user?.id,
  });

  const handleAddLog = (metricType: string) => {
    toast({
      title: "Add New Log",
      description: `Add a new ${metricType} entry`,
    });
  };

  const handleUploadPicture = () => {
    toast({
      title: "Upload Picture",
      description: "Upload a picture for glucose tracking",
    });
  };

  const handleHealthAssessment = () => {
    toast({
      title: "Health Assessment",
      description: "Start your health assessment",
    });
  };

  const handleUpgrade = () => {
    toast({
      title: "Upgrade to Paid Plan",
      description: "Unlock unlimited logging and premium features",
    });
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />
      
      <main className="flex-1" style={{ marginLeft: '295px', padding: '32px' }}>
        <div className="mx-auto" style={{ maxWidth: '1145px' }}>
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
              <div className="mb-6" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>—</span> mg/dL
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
              <div className="mb-6" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>—</span> mg/dL
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
              <div className="mb-6" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
                <span style={{ fontSize: '24px' }}>—</span> mg/dL
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
                background: '#D3D3D3',
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
                      <stop offset="0%" stopColor="#90EE90" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#90EE90" stopOpacity={0.2} />
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
                    stroke="#90EE90"
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
                        <stop offset="0%" stopColor="#90EE90" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#90EE90" stopOpacity={0.2} />
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
                      stroke="#90EE90"
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
                        <stop offset="0%" stopColor="#90EE90" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#90EE90" stopOpacity={0.2} />
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
                      stroke="#90EE90"
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
    </div>
  );
}
