import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { HealthMetric } from '@shared/schema';
import type { MetricType } from '../pages/Dashboard';

interface HealthMetricCardProps {
  type: MetricType;
  latestValue: string | number | null;
  trendArrow: React.ReactNode;
  onAddLog: () => void;
  onUploadPicture?: () => void;
  onUpgrade: () => void;
  disabled?: boolean;
  dailyLimit?: number;
}

export function HealthMetricCard({
  type,
  latestValue,
  trendArrow,
  onAddLog,
  onUploadPicture,
  onUpgrade,
  disabled = false,
  dailyLimit = 2,
}: HealthMetricCardProps) {
  const config = {
    glucose: {
      title: 'Current Glucose',
      unit: 'mg/dL',
      showUploadButton: true,
    },
    steps: {
      title: 'Steps Walked',
      unit: 'steps',
      showUploadButton: false,
    },
    water: {
      title: 'Water Intake',
      unit: 'L',
      showUploadButton: false,
    },
    heartbeat: {
      title: 'Heart Rate',
      unit: 'bpm',
      showUploadButton: false,
    },
  };

  const metricConfig = config[type];

  const formatValue = () => {
    if (latestValue === null || latestValue === undefined) return '—';
    if (type === 'steps' && typeof latestValue === 'number') {
      return latestValue.toLocaleString();
    }
    if (type === 'water' && typeof latestValue === 'string') {
      return parseFloat(latestValue).toFixed(1);
    }
    if (type === 'heartbeat' && typeof latestValue === 'number') {
      return latestValue.toString();
    }
    return latestValue;
  };

  return (
    <Card
      className="overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '24px',
      }}
      data-testid={`card-${type}`}
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
        {metricConfig.title}
      </h3>
      <div className="mb-6 flex items-center" style={{ fontSize: '32px', fontWeight: 700, color: '#00453A' }}>
        <span style={{ fontSize: '24px' }}>{formatValue()}</span>
        <span style={{ fontSize: '16px', marginLeft: '4px' }}>{metricConfig.unit}</span>
        {trendArrow}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onAddLog}
          disabled={disabled}
          className="min-w-0 flex-1 sm:flex-none w-full "
          style={{
            background: disabled ? '#F5F5F5' : '#FFFFFF',
            border: '1px solid #00856F',
            borderRadius: '8px',
            color: disabled ? '#9E9E9E' : '#00856F',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 16px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          data-testid={`button-add-${type}-log`}
        >
          Add New Log
        </Button>
        {metricConfig.showUploadButton && (
          <Button
            variant="outline"
            onClick={onUploadPicture}
            disabled={disabled}
            className="min-w-0 flex-1 sm:flex-none w-full "
            style={{
              background: disabled ? '#F5F5F5' : '#FFFFFF',
              border: '1px solid #00856F',
              borderRadius: '8px',
              color: disabled ? '#9E9E9E' : '#00856F',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 16px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
            data-testid={`button-upload-picture-${type}`}
          >
            Upload Picture
          </Button>
        )}
      </div>
      {type !== 'heartbeat' && dailyLimit > 0 && (
        <p
          className="mt-3 text-xs"
          style={{ color: '#546E7A', fontSize: '12px', lineHeight: '16px' }}
        >
          *limited to {dailyLimit} log{dailyLimit !== 1 ? 's' : ''} per day.{' '}
          <button
            onClick={onUpgrade}
            style={{ color: '#00856F', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            data-testid={`link-upgrade-${type}`}
          >
            Upgrade to Paid Plan
          </button>
        </p>
      )}
    </Card>
  );
}

