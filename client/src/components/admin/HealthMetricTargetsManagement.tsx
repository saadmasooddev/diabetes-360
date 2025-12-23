import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecommendedTargets, useUpsertRecommendedTargetsBatch } from '@/hooks/mutations/useHealth';
import { Target } from 'lucide-react';
import { handleNumberInput } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { EXERCISE_TYPE_ENUM, MetricType } from '@shared/schema';

export function HealthMetricTargetsManagement() {
  const { data: recommendedTargets, isLoading } = useRecommendedTargets();
  const upsertMutation = useUpsertRecommendedTargetsBatch();
  const { toast } = useToast();

  const [glucoseTarget, setGlucoseTarget] = useState<string>('');
  const [stepsTarget, setStepsTarget] = useState<string>('');
  const [waterTarget, setWaterTarget] = useState<string>('');
  const [heartRateTarget, setHeartRateTarget] = useState<string>('');

  useEffect(() => {
    if (recommendedTargets) {
      const glucose = recommendedTargets.find(t => t.metricType === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE);
      const steps = recommendedTargets.find(t => t.metricType === EXERCISE_TYPE_ENUM.STEPS);
      const water = recommendedTargets.find(t => t.metricType === EXERCISE_TYPE_ENUM.WATER_INTAKE);
      const heartRate = recommendedTargets.find(t => t.metricType === EXERCISE_TYPE_ENUM.HEART_RATE);

      setGlucoseTarget(glucose ? parseFloat(glucose.targetValue).toString() : '');
      setStepsTarget(steps ? parseFloat(steps.targetValue).toString() : '');
      setWaterTarget(water ? parseFloat(water.targetValue).toString() : '');
      setHeartRateTarget(heartRate ? parseFloat(heartRate.targetValue).toString() : '');
    }
  }, [recommendedTargets]);

  const validateTarget = (metricType: MetricType, value: number): string | null => {
    switch (metricType) {
      case EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE:
        if (value < 70 || value > 200) {
          return 'Blood glucose target must be between 70-200 mg/dL';
        }
        break;
      case EXERCISE_TYPE_ENUM.STEPS:
        if (value < 0 || value > 50000) {
          return 'Steps target must be between 0-50,000 steps per day';
        }
        break;
      case EXERCISE_TYPE_ENUM.WATER_INTAKE:
        if (value < 0 || value > 5) {
          return 'Water intake target must be between 0-5 liters per day';
        }
        break;
      case EXERCISE_TYPE_ENUM.HEART_RATE:
        if (value < 40 || value > 200) {
          return 'Heart rate target must be between 40-200 bpm';
        }
        break;
    }
    return null;
  };

  const handleSaveAll = async () => {
    const targets: Array<{ metricType: MetricType; targetValue: number }> = [];
    const errors: string[] = [];

    if (glucoseTarget) {
      const numValue = parseFloat(glucoseTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget(EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE, numValue);
        if (error) {
          errors.push(error);
        } else {
          targets.push({ metricType: EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE, targetValue: numValue });
        }
      }
    }

    if (stepsTarget) {
      const numValue = parseFloat(stepsTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget(EXERCISE_TYPE_ENUM.STEPS, numValue);
        if (error) {
          errors.push(error);
        } else {
          targets.push({ metricType: EXERCISE_TYPE_ENUM.STEPS, targetValue: numValue });
        }
      }
    }

    if (waterTarget) {
      const numValue = parseFloat(waterTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget(EXERCISE_TYPE_ENUM.WATER_INTAKE, numValue);
        if (error) {
          errors.push(error);
        } else {
          targets.push({ metricType: EXERCISE_TYPE_ENUM.WATER_INTAKE, targetValue: numValue });
        }
      }
    }

    if (heartRateTarget) {
      const numValue = parseFloat(heartRateTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget(EXERCISE_TYPE_ENUM.HEART_RATE, numValue);
        if (error) {
          errors.push(error);
        } else {
          targets.push({ metricType: EXERCISE_TYPE_ENUM.HEART_RATE, targetValue: numValue });
        }
      }
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: 'Validation Error',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }

    if (targets.length === 0) {
      toast({
        title: 'No targets to save',
        description: 'Please enter at least one target value',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertMutation.mutateAsync(targets);
    } catch (error: any) {
      // Error toast is handled by the mutation hook
    }
  };

  const isSubmitting = upsertMutation.isPending;

  return (
    <Card
      className="overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
    >
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
          Recommended Health Metric Targets
        </CardTitle>
        <CardDescription className="text-sm">
          Set recommended target values for health metrics. These will be shown to all users as guidance.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading targets...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="glucose-target" className="text-sm font-medium text-gray-700">
                  Blood Glucose Target (mg/dL)
                </Label>
                <Input
                  id="glucose-target"
                  type="text"
                  inputMode="numeric"
                  value={glucoseTarget}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(glucoseTarget, e.target.value);
                    setGlucoseTarget(sanitized);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Recommended target for blood glucose levels
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps-target" className="text-sm font-medium text-gray-700">
                  Steps Target (per day)
                </Label>
                <Input
                  id="steps-target"
                  type="text"
                  inputMode="numeric"
                  value={stepsTarget}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(stepsTarget, e.target.value);
                    setStepsTarget(sanitized);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Recommended target for daily steps
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="water-target" className="text-sm font-medium text-gray-700">
                  Water Intake Target (liters)
                </Label>
                <Input
                  id="water-target"
                  type="text"
                  inputMode="numeric"
                  value={waterTarget}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(waterTarget, e.target.value);
                    setWaterTarget(sanitized);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Recommended target for daily water intake
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart-rate-target" className="text-sm font-medium text-gray-700">
                  Heart Rate Target (bpm)
                </Label>
                <Input
                  id="heart-rate-target"
                  type="text"
                  inputMode="numeric"
                  value={heartRateTarget}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(heartRateTarget, e.target.value);
                    setHeartRateTarget(sanitized);
                  }}
                  className="w-full"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Recommended target for heart rate
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveAll}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save All Targets'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

