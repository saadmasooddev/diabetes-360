import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ROUTES } from '@/config/routes';
import { useTodayExerciseTotals, useStrengthProgress, useAddExerciseLogsBatch } from '@/hooks/mutations/useHealth';
import { useAuthStore } from '@/stores/authStore';
import { handleNumberInput } from '@/lib/utils';

type TimeRange = '1 Day' | '1 Month' | '1 Year';

export function StrengthTrainingProgress() {
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1 Day');
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseCounts, setExerciseCounts] = useState({
    pushups: '',
    squats: '',
    chinups: '',
    situps: '',
  });

  // Calculate start and end dates based on selected range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    if (selectedRange === '1 Day') {
      start.setDate(start.getDate() - 7); // Show last 7 days
    } else if (selectedRange === '1 Month') {
      start.setMonth(start.getMonth() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 1);
    }
    start.setHours(0, 0, 0, 0);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedRange]);

  const { data: todayTotals, isLoading: isLoadingTotals } = useTodayExerciseTotals();
  const { data: strengthProgress, isLoading: isLoadingProgress } = useStrengthProgress(startDate, endDate);
  const addExerciseLogsBatch = useAddExerciseLogsBatch();

  const todayWorkout = [
    { name: 'Push-ups', count: todayTotals?.pushups || 0, color: '#00856F', key: 'pushups' as const },
    { name: 'Squats', count: todayTotals?.squats || 0, color: '#00856F', key: 'squats' as const },
    { name: 'Chinups', count: todayTotals?.chinups || 0, color: '#00856F', key: 'chinups' as const },
    { name: 'Sit-ups', count: todayTotals?.situps || 0, color: '#00856F', key: 'situps' as const },
  ];

  // Transform logs data for chart
  const chartData = useMemo(() => {
    if (!strengthProgress?.logs || strengthProgress.logs.length === 0) {
      return [];
    }

    return strengthProgress.logs.map((log) => {
      // Format date for display based on range
      const date = new Date(log.date);
      let dateLabel: string;

      if (selectedRange === '1 Day') {
        // Show day name for 1 Day range
        dateLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (selectedRange === '1 Month') {
        // Show day of month for 1 Month range
        dateLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        // Show month for 1 Year range
        dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      return {
        date: log.date,
        dateLabel,
        total: log.total,
        pushups: log.pushups,
        squats: log.squats,
        chinups: log.chinups,
        situps: log.situps,
      };
    });
  }, [strengthProgress?.logs, selectedRange]);

  // Calculate max value for Y-axis domain
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => d.total));
    return Math.ceil(max * 1.1); // Add 10% padding
  }, [chartData]);

  const percentageImprovement = strengthProgress?.percentageImprovement ?? 0;

  const handleBack = () => {
    setLocation(ROUTES.TIPS_EXERCISES);
  };

  const handleExerciseCountChange = (exercise: keyof typeof exerciseCounts, value: string) => {
    const currentValue = exerciseCounts[exercise];
    const sanitized = handleNumberInput(currentValue, value);
    // Only allow integers (no decimals for exercise counts)
    if (sanitized === '' || /^\d+$/.test(sanitized)) {
      setExerciseCounts(prev => ({
        ...prev,
        [exercise]: sanitized,
      }));
    }
  };

  const handleLogExercises = async () => {
    const exercises = [
      { exerciseType: 'pushups' as const, count: parseInt(exerciseCounts.pushups) || 0 },
      { exerciseType: 'squats' as const, count: parseInt(exerciseCounts.squats) || 0 },
      { exerciseType: 'chinups' as const, count: parseInt(exerciseCounts.chinups) || 0 },
      { exerciseType: 'situps' as const, count: parseInt(exerciseCounts.situps) || 0 },
    ].filter(ex => ex.count > 0);

    if (exercises.length === 0) {
      return;
    }

    try {
      await addExerciseLogsBatch.mutateAsync(exercises);
      // Close modal and reset
      setIsExerciseModalOpen(false);
      setExerciseCounts({
        pushups: '',
        squats: '',
        chinups: '',
        situps: '',
      });
    } catch (error) {
      // Error is handled by the mutation hook (toast notification)
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-colors"
              aria-label="Go back"
              data-testid="button-back"
            >
              <ArrowLeft size={20} color="#00856F" />
            </button>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#00856F',
              }}
              data-testid="text-page-title"
            >
              Strength Training Progress
            </h1>
          </div>

          {/* Today's Workout */}
          <div className="mb-8">
            <h2
              className="mb-6"
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#00856F',
              }}
              data-testid="text-todays-workout"
            >
              Today's Workout
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {todayWorkout.map((exercise) => (
                <Card
                  key={exercise.name}
                  className="p-6"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  data-testid={`card-exercise-${exercise.name.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#00856F',
                      }}
                    >
                      {exercise.name}
                    </h3>
                    <TrendingUp size={20} color="#00856F" />
                  </div>
                  <p
                    style={{
                      fontSize: '48px',
                      fontWeight: 700,
                      color: '#00453A',
                      lineHeight: '1',
                    }}
                    data-testid={`text-count-${exercise.name.toLowerCase()}`}
                  >
                    {exercise.count}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Strength Progress Chart */}
          <Card
            className="p-8"
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
            data-testid="card-strength-progress"
          >
            <div className="mb-6">
              <h2
                className="mb-2"
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#00856F',
                }}
              >
                Strength Progress
              </h2>
              <div className="flex items-baseline gap-2">
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: percentageImprovement >= 0 ? '#4CAF50' : '#EF5350',
                  }}
                  data-testid="text-progress-percentage"
                >
                  {isLoadingProgress ? '...' : `${percentageImprovement >= 0 ? '+' : ''}${percentageImprovement}%`}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  improvement
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-6" style={{ height: '300px' }}>
              {isLoadingProgress ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading chart data...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="#546E7A"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#546E7A"
                      style={{ fontSize: '12px' }}
                      domain={[0, maxValue]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'Total Exercises']}
                      labelFormatter={(label) => {
                        const log = chartData.find(d => d.dateLabel === label);
                        return log ? new Date(log.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : label;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#EF5350"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#EF5350' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Time Range Selector */}
            <div className="flex justify-center gap-4">
              {(['1 Day', '1 Month', '1 Year'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  variant="ghost"
                  className={`px-6 py-2 rounded-lg transition-colors ${selectedRange === range
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  style={{
                    fontWeight: selectedRange === range ? 600 : 400,
                    fontSize: '14px',
                  }}
                  data-testid={`button-range-${range.replace(' ', '-').toLowerCase()}`}
                >
                  {range}
                </Button>
              ))}
            </div>
          </Card>

          {/* Log Exercises Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => setIsExerciseModalOpen(true)}
              style={{
                background: '#00856F',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '16px',
                borderRadius: '8px',
                padding: '16px 32px',
                height: 'auto',
              }}
              data-testid="button-log-exercises"
            >
              Log Exercises
            </Button>
          </div>
        </div>
      </main>

      {/* Exercise Logging Modal */}
      <Dialog open={isExerciseModalOpen} onOpenChange={setIsExerciseModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="mb-8"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#00453A',
              }}
            >
              Enter number of exercises
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Push-ups */}
            <div>
              <div className="mb-2">
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#00856F',
                  }}
                >
                  Push-ups (30)
                </span>
                {/* <button
                  className="ml-2 text-teal-600 hover:text-teal-700 text-sm"
                  style={{ fontWeight: 500 }}
                  data-testid="link-tutorial-pushups"
                >
                  Watch Tutorial
                </button> */}
              </div>
              <input
                type="text"
                value={exerciseCounts.pushups}
                onChange={(e) => handleExerciseCountChange('pushups', e.target.value)}
                placeholder="Enter the number of Pushups"
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  color: '#00453A',
                }}
                data-testid="input-pushups"
              />
            </div>

            {/* Squats */}
            <div>
              <div className="mb-2">
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#00856F',
                  }}
                >
                  Squats (15)
                </span>
                {/* <button
                  className="ml-2 text-teal-600 hover:text-teal-700 text-sm"
                  style={{ fontWeight: 500 }}
                  data-testid="link-tutorial-squats"
                >
                  Watch Tutorial
                </button> */}
              </div>
              <input
                type="text"
                value={exerciseCounts.squats}
                onChange={(e) => handleExerciseCountChange('squats', e.target.value)}
                placeholder="Enter the number of Squats"
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  color: '#00453A',
                }}
                data-testid="input-squats"
              />
            </div>

            {/* Chinups */}
            <div>
              <div className="mb-2">
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#00856F',
                  }}
                >
                  Chinups (10)
                </span>
                {/* <button
                  className="ml-2 text-teal-600 hover:text-teal-700 text-sm"
                  style={{ fontWeight: 500 }}
                  data-testid="link-tutorial-chinups"
                >
                  Watch Tutorial
                </button> */}
              </div>
              <input
                type="text"
                value={exerciseCounts.chinups}
                onChange={(e) => handleExerciseCountChange('chinups', e.target.value)}
                placeholder="Enter the number of Chinups"
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  color: '#00453A',
                }}
                data-testid="input-chinups"
              />
            </div>

            {/* Sit-ups */}
            <div>
              <div className="mb-2">
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#00856F',
                  }}
                >
                  Sit-ups (30)
                </span>
                {/* <button
                  className="ml-2 text-teal-600 hover:text-teal-700 text-sm"
                  style={{ fontWeight: 500 }}
                  data-testid="link-tutorial-situps"
                >
                  Watch Tutorial
                </button> */}
              </div>
              <input
                type="text"
                value={exerciseCounts.situps}
                onChange={(e) => handleExerciseCountChange('situps', e.target.value)}
                placeholder="Enter the number of Sit-ups"
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  color: '#00453A',
                }}
                data-testid="input-situps"
              />
            </div>
          </div>

          <Button
            onClick={handleLogExercises}
            className="w-full"
            disabled={addExerciseLogsBatch.isPending}
            style={{
              background: '#00856F',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '16px',
              borderRadius: '8px',
              padding: '16px',
              height: 'auto',
            }}
            data-testid="button-log-exercise"
          >
            {addExerciseLogsBatch.isPending ? 'Logging...' : 'Log Now'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
