import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Droplet, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { API_ENDPOINTS } from '@/config/endpoints';
import type { HealthMetric } from '@shared/schema';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  metricType?: string;
}

function CircularGauge({ value, maxValue, label, unit, size = 180, metricType = '' }: CircularGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const testId = metricType 
    ? `gauge-${metricType}-${label.toLowerCase().replace(/\s/g, '-')}`
    : `gauge-${label.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="flex flex-col items-center" data-testid={testId}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r="70"
            fill="none"
            stroke="#E0F2F1"
            strokeWidth="20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="70"
            fill="none"
            stroke="#00856F"
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#00453A' }}>
            {value}{unit}
          </span>
        </div>
      </div>
      <p
        className="mt-4 text-center"
        style={{ fontSize: '14px', fontWeight: 500, color: '#546E7A' }}
      >
        {label}
      </p>
    </div>
  );
}

export function HealthAssessment() {
  const user = useAuthStore((state) => state.user);

  const { data: metrics = [] } = useQuery<HealthMetric[]>({
    queryKey: [`${API_ENDPOINTS.HEALTH.METRICS}?userId=${user?.id}&limit=30`],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const calculateAverage = (field: keyof HealthMetric, days: number) => {
    if (!metrics.length) return 0;
    const recentMetrics = metrics.slice(0, days);
    const values = recentMetrics
      .map(m => {
        const val = m[field];
        if (typeof val === 'string') return parseFloat(val);
        if (typeof val === 'number') return val;
        return 0;
      })
      .filter(v => v > 0);
    
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  // Calculate averages or use sample data if no metrics exist
  const glucoseDaily = calculateAverage('bloodSugar', 1) || 135;
  const glucoseWeekly = calculateAverage('bloodSugar', 7) || 98;
  const glucoseMonthly = calculateAverage('bloodSugar', 30) || 106;

  const waterDaily = metrics.length 
    ? (calculateAverage('waterIntake', 1) / 10).toFixed(1)
    : '1.2';
  const waterWeekly = metrics.length
    ? (calculateAverage('waterIntake', 7) / 10).toFixed(1)
    : '0.8';
  const waterMonthly = metrics.length
    ? (calculateAverage('waterIntake', 30) / 10).toFixed(1)
    : '2.0';

  const stepsDaily = calculateAverage('steps', 1) || 3000;
  const stepsWeekly = calculateAverage('steps', 7) || 6600;
  const stepsMonthly = calculateAverage('steps', 30) || 8700;

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />
      
      <main className="flex-1 w-full">
        <div className="w-full px-4 py-8 sm:px-6 lg:pl-[320px] lg:pr-8 xl:pl-[340px] xl:pr-12">
          <h1
            className="mb-8"
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#00453A',
              lineHeight: '40px',
            }}
            data-testid="title-health-assessment"
          >
            Glucose Analysis
          </h1>

          {/* Glucose Analysis Section */}
          <Card
            className="mb-6 p-8"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
            }}
            data-testid="section-glucose-analysis"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
              <CircularGauge
                value={glucoseDaily}
                maxValue={200}
                label="Daily Average"
                unit="mg/dL"
                metricType="glucose"
              />
              <CircularGauge
                value={glucoseWeekly}
                maxValue={200}
                label="Weekly Average"
                unit="mg/dL"
                metricType="glucose"
              />
              <CircularGauge
                value={glucoseMonthly}
                maxValue={200}
                label="Monthly Average"
                unit="mg/dL"
                metricType="glucose"
              />
            </div>
          </Card>

          {/* Hydration and Activity Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hydration Analysis */}
            <Card
              className="p-8"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              }}
              data-testid="section-hydration-analysis"
            >
              <h2
                className="mb-6"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#00453A',
                }}
              >
                Hydration Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <CircularGauge
                  value={parseFloat(waterDaily)}
                  maxValue={5}
                  label="Daily Average"
                  unit="L"
                  size={140}
                  metricType="hydration"
                />
                <CircularGauge
                  value={parseFloat(waterWeekly)}
                  maxValue={5}
                  label="Weekly Average"
                  unit="L"
                  size={140}
                  metricType="hydration"
                />
                <CircularGauge
                  value={parseFloat(waterMonthly)}
                  maxValue={5}
                  label="Monthly Average"
                  unit="L"
                  size={140}
                  metricType="hydration"
                />
              </div>
            </Card>

            {/* Activity Analysis */}
            <Card
              className="p-8"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              }}
              data-testid="section-activity-analysis"
            >
              <h2
                className="mb-6"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#00453A',
                }}
              >
                Activity Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <CircularGauge
                  value={stepsDaily}
                  maxValue={15000}
                  label="Daily Average"
                  unit=" steps"
                  size={140}
                  metricType="activity"
                />
                <CircularGauge
                  value={stepsWeekly}
                  maxValue={15000}
                  label="Weekly Average"
                  unit=" steps"
                  size={140}
                  metricType="activity"
                />
                <CircularGauge
                  value={stepsMonthly}
                  maxValue={15000}
                  label="Monthly Average"
                  unit=" steps"
                  size={140}
                  metricType="activity"
                />
              </div>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Hydration Summary */}
            <Card
              className="p-6"
              style={{
                background: '#E0F2F1',
                border: '1px solid #00BCD4',
                borderRadius: '12px',
              }}
              data-testid="card-hydration-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#00856F',
                  }}
                >
                  <Droplet style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#00453A',
                    }}
                  >
                    Hydration Analysis Summary
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#546E7A',
                      lineHeight: '20px',
                    }}
                  >
                    Your all time average is good! Please drink often to hydrate more.
                  </p>
                </div>
              </div>
            </Card>

            {/* Glucose Summary */}
            <Card
              className="p-6"
              style={{
                background: '#E0F2F1',
                border: '1px solid #00BCD4',
                borderRadius: '12px',
              }}
              data-testid="card-glucose-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#00856F',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L12 22M7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#00453A',
                    }}
                  >
                    Glucose Analysis Summary
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#546E7A',
                      lineHeight: '20px',
                    }}
                  >
                    Your all time average is good! Please maintain your glucose levels.
                  </p>
                </div>
              </div>
            </Card>

            {/* Activity Summary */}
            <Card
              className="p-6"
              style={{
                background: '#E0F2F1',
                border: '1px solid #00BCD4',
                borderRadius: '12px',
              }}
              data-testid="card-activity-summary"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: '#00856F',
                  }}
                >
                  <Activity style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#00453A',
                    }}
                  >
                    Activity Analysis Summary
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#546E7A',
                      lineHeight: '20px',
                    }}
                  >
                    Your all time average is good! Please try and be active as much as you can!
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* What to Do Next Section */}
          <Card
            className="p-8"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
            }}
            data-testid="section-what-to-do-next"
          >
            <h2
              className="mb-4"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#00453A',
              }}
            >
              What to Do Next
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#546E7A',
                lineHeight: '24px',
              }}
            >
              Continue tracking your health metrics regularly. Maintain a balanced diet, stay hydrated, and keep up with your physical activity. Consult with your healthcare provider if you notice any significant changes in your readings.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
