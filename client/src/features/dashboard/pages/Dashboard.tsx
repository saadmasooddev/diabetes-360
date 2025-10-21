import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Droplets, Heart, Activity, Weight, TrendingUp, LogOut, BarChart3 } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { QuickActions } from '../components/QuickActions';
import { AddMetricDialog } from '../components/AddMetricDialog';
import { healthService } from '../services/healthService';
import { API_ENDPOINTS } from '@/config/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';
import { useLocation } from 'wouter';

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [addMetricOpen, setAddMetricOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { data: latestMetrics, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.HEALTH.LATEST, user?.id],
    queryFn: () => healthService.getLatestMetrics(user?.id || ''),
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    logout();
    setLocation(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-dashboard-title">
              Health Dashboard
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400" data-testid="text-welcome-message">
              Welcome back, {user?.fullName || user?.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation(ROUTES.METRICS_HISTORY)}
              data-testid="button-view-metrics"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Metrics
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 rounded bg-gray-200 dark:bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Blood Sugar"
              value={latestMetrics?.bloodSugar ?? null}
              unit="mg/dL"
              icon={Droplets}
              color="bg-blue-500"
              onClick={() => setAddMetricOpen(true)}
            />
            <MetricCard
              title="Blood Pressure"
              value={
                latestMetrics?.bloodPressureSystolic && latestMetrics?.bloodPressureDiastolic
                  ? `${latestMetrics.bloodPressureSystolic}/${latestMetrics.bloodPressureDiastolic}`
                  : null
              }
              unit="mmHg"
              icon={Heart}
              color="bg-red-500"
              onClick={() => setAddMetricOpen(true)}
            />
            <MetricCard
              title="Heart Rate"
              value={latestMetrics?.heartRate ?? null}
              unit="bpm"
              icon={Activity}
              color="bg-pink-500"
              onClick={() => setAddMetricOpen(true)}
            />
            <MetricCard
              title="Weight"
              value={latestMetrics?.weight ?? null}
              unit="kg"
              icon={Weight}
              color="bg-green-500"
              onClick={() => setAddMetricOpen(true)}
            />
            <MetricCard
              title="Steps"
              value={latestMetrics?.steps ?? null}
              unit="steps"
              icon={TrendingUp}
              color="bg-purple-500"
              onClick={() => setAddMetricOpen(true)}
            />
            <div className="md:col-span-2 lg:col-span-1">
              <QuickActions onAddMetric={() => setAddMetricOpen(true)} />
            </div>
          </div>
        )}

        {!isLoading && !latestMetrics && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You haven't logged any health metrics yet. Start tracking your health by adding your first measurements.
              </p>
              <Button onClick={() => setAddMetricOpen(true)} data-testid="button-get-started">
                Add Your First Metrics
              </Button>
            </CardContent>
          </Card>
        )}

        {latestMetrics && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Latest Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-last-updated">
                Last updated: {new Date(latestMetrics.recordedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddMetricDialog open={addMetricOpen} onOpenChange={setAddMetricOpen} />
    </div>
  );
}
