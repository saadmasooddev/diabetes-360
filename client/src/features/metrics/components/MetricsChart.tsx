import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HealthMetric } from '@shared/schema';
import { format, subDays } from 'date-fns';

interface MetricsChartProps {
  data: HealthMetric[];
  metricType: string;
  unit: string;
  timeRange: string;
}

export function MetricsChart({ data, metricType, unit, timeRange }: MetricsChartProps) {
  const chartData = useMemo(() => {
    // Filter data based on time range
    let filteredData = [...data];
    const now = new Date();

    if (timeRange === '7d') {
      const cutoff = subDays(now, 7);
      filteredData = data.filter(d => new Date(d.recordedAt) >= cutoff);
    } else if (timeRange === '30d') {
      const cutoff = subDays(now, 30);
      filteredData = data.filter(d => new Date(d.recordedAt) >= cutoff);
    } else if (timeRange === '90d') {
      const cutoff = subDays(now, 90);
      filteredData = data.filter(d => new Date(d.recordedAt) >= cutoff);
    }

    // Sort by date
    filteredData.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    // Transform data for chart
    return filteredData.map(item => {
      const date = format(new Date(item.recordedAt), 'MMM dd');
      
      if (metricType === 'bloodPressure') {
        return {
          date,
          systolic: item.bloodPressureSystolic,
          diastolic: item.bloodPressureDiastolic,
        };
      }
      
      let value: number | null = null;
      switch (metricType) {
        case 'bloodSugar':
          value = item.bloodSugar ? parseFloat(item.bloodSugar) : null;
          break;
        case 'heartRate':
          value = item.heartRate;
          break;
        case 'weight':
          value = item.weight ? parseFloat(item.weight) : null;
          break;
        case 'steps':
          value = item.steps;
          break;
      }

      return {
        date,
        value,
      };
    }).filter(item => metricType === 'bloodPressure' ? (item.systolic !== null || item.diastolic !== null) : item.value !== null);
  }, [data, metricType, timeRange]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-500">
        No data available for the selected time range
      </div>
    );
  }

  if (metricType === 'bloodPressure') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="systolic" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Systolic"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Diastolic"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const getLineColor = () => {
    switch (metricType) {
      case 'bloodSugar':
        return '#3b82f6';
      case 'heartRate':
        return '#ec4899';
      case 'weight':
        return '#10b981';
      case 'steps':
        return '#8b5cf6';
      default:
        return '#6366f1';
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ value: unit, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={getLineColor()} 
          strokeWidth={2}
          dot={{ r: 4 }}
          name={unit}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
