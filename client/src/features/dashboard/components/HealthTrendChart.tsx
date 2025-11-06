import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  time: string;
  value: number;
}

type IntervalType = 'daily' | 'weekly' | 'monthly';

interface HealthTrendChartProps {
  title: string;
  data: ChartDataPoint[];
  gradientId: string;
  testId: string;
  height?: number;
  yAxisConfig?: {
    domain: [number, number];
    ticks?: number[];
    label?: string;
  };
  interval?: IntervalType;
  onIntervalChange?: (interval: IntervalType) => void;
}

export function HealthTrendChart({
  title,
  data,
  gradientId,
  testId,
  height = 250,
  yAxisConfig,
  interval = 'daily',
  onIntervalChange,
}: HealthTrendChartProps) {
  return (
    <Card
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '24px',
      }}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-semibold"
          style={{
            color: '#00453A',
            fontSize: '20px',
            lineHeight: '28px',
            fontWeight: 600,
          }}
        >
          {title}
        </h3>
        {onIntervalChange && (
          <Select value={interval} onValueChange={(value) => onIntervalChange(value as IntervalType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
            domain={yAxisConfig?.domain || [0, 'auto']}
            ticks={yAxisConfig?.ticks}
            label={yAxisConfig?.label ? { value: yAxisConfig.label, position: 'insideLeft', fill: '#546E7A', fontSize: 11 } : undefined}
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
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

