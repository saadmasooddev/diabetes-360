import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
  recommendedTarget?: number;
  userTarget?: number;
  metricType?: 'glucose' | 'steps' | 'water_intake' | 'heart_rate';
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
  recommendedTarget,
  userTarget,
  metricType,
}: HealthTrendChartProps) {
  // Calculate dynamic domain based on data values and targets
  const calculateDomain = (): [number, number | string] => {
    if (!yAxisConfig?.domain) {
      // If no domain specified, use auto
      return [0, 'auto'];
    }

    const [min, max] = yAxisConfig.domain;
    
    // Find the maximum value in the data
    const maxDataValue = data.length > 0 
      ? Math.max(...data.map(d => d.value || 0))
      : 0;
    
    // Consider targets in the max calculation
    const maxTarget = Math.max(
      recommendedTarget || 0,
      userTarget || 0
    );
    
    // Calculate the actual max needed
    const actualMax = Math.max(maxDataValue, maxTarget, max);
    
    // If actualMax exceeds the configured max, use actualMax with 10% padding
    if (actualMax > max) {
      return [min, Math.ceil(actualMax * 1.1)];
    }
    
    // Otherwise use the configured domain
    return [min, max];
  };

  const dynamicDomain = calculateDomain();

  // Prepare data with target values for each point
  const chartData = data.map(point => ({
    ...point,
    recommendedTarget: recommendedTarget,
    userTarget: userTarget,
  }));
  return (
    <Card
      className="transition-all duration-300 hover:shadow-xl"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 133, 111, 0.12)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      }}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0, 133, 111, 0.1)' }}>
        <h3
          className="font-semibold"
          style={{
            color: '#00453A',
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h3>
        {onIntervalChange && (
          <Select value={interval} onValueChange={(value) => onIntervalChange(value as IntervalType)}>
            <SelectTrigger
              className="w-36 transition-all duration-200 hover:border-[#00856F]"
              style={{
                border: '1.5px solid rgba(0, 133, 111, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
              }}
            >
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
        <AreaChart data={chartData}>
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
            domain={dynamicDomain}
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
            name="Current Value"
          />
          {recommendedTarget !== undefined && recommendedTarget !== null && (
            <ReferenceLine
              y={recommendedTarget}
              stroke="#FF9800"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: "Recommended", position: "right", fill: "#FF9800", fontSize: 11 }}
            />
          )}
          {userTarget !== undefined && userTarget !== null && (
            <ReferenceLine
              y={userTarget}
              stroke="#2196F3"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: "Your Target", position: "right", fill: "#2196F3", fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      {(recommendedTarget !== undefined || userTarget !== undefined) && (
        <div
          className="mt-6 pt-4 flex flex-wrap items-center justify-center gap-6"
          style={{
            borderTop: '1px solid rgba(0, 133, 111, 0.1)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-1 rounded-full"
              style={{ background: '#00856F' }}
            ></div>
            <span className="text-sm font-medium" style={{ color: '#546E7A' }}>
              Current Progress
            </span>
          </div>
          {recommendedTarget !== undefined && recommendedTarget !== null && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-1 border-t-2 border-dashed rounded-full"
                style={{ borderColor: '#FF9800' }}
              ></div>
              <span className="text-sm font-medium" style={{ color: '#546E7A' }}>
                Recommended Target
              </span>
            </div>
          )}
          {userTarget !== undefined && userTarget !== null && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-1 border-t-2 border-dashed rounded-full"
                style={{ borderColor: '#2196F3' }}
              ></div>
              <span className="text-sm font-medium" style={{ color: '#546E7A' }}>
                Your Target
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

