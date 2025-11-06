import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { MetricType } from '../pages/Dashboard';

interface AddMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: MetricType;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AddMetricDialog({
  open,
  onOpenChange,
  metricType,
  value,
  onValueChange,
  onSubmit,
  isSubmitting,
}: AddMetricDialogProps) {
  const config = {
    glucose: {
      title: 'Log Glucose',
      placeholder: 'Enter glucose level (mg/dL)',
    },
    steps: {
      title: 'Log Steps',
      placeholder: 'Enter steps count',
    },
    water: {
      title: 'Log Water Intake',
      placeholder: 'Enter water intake (L)',
    },
    heartbeat: {
      title: 'Log Heart Rate',
      placeholder: 'Enter heart rate (bpm)',
    },
  };

  const metricConfig = config[metricType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {metricConfig.title}
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
              placeholder={metricConfig.placeholder}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
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
            onClick={onSubmit}
            disabled={isSubmitting}
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
            {isSubmitting ? 'Logging...' : 'Log Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

