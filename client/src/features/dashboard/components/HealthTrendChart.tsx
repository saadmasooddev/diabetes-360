import { Card } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  time: string;
  value: number;
}

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
}

export function HealthTrendChart({
  title,
  data,
  gradientId,
  testId,
  height = 250,
  yAxisConfig,
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
      <h3
        className="mb-6 font-semibold"
        style={{
          color: '#00453A',
          fontSize: '20px',
          lineHeight: '28px',
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
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

