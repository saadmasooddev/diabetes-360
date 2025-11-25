import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTargetsForUser, useUpsertUserTargetsBatch, useDeleteUserTarget } from '@/hooks/mutations/useHealth';
import { Target, X } from 'lucide-react';
import { handleNumberInput } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

export function UserHealthTargets() {
  const { user } = useAuthStore();
  const isPaidUser = user?.paymentType !== 'free'
  const { data: targets, isLoading } = useTargetsForUser();
  const upsertMutation = useUpsertUserTargetsBatch();
  const deleteMutation = useDeleteUserTarget();
  const { toast } = useToast();

  const [glucoseTarget, setGlucoseTarget] = useState<string>('');
  const [stepsTarget, setStepsTarget] = useState<string>('');
  const [waterTarget, setWaterTarget] = useState<string>('');
  const [heartRateTarget, setHeartRateTarget] = useState<string>('');

  // Get recommended targets as fallback
  const recommendedGlucose = targets?.recommended.find(t => t.metricType === 'glucose');
  const recommendedSteps = targets?.recommended.find(t => t.metricType === 'steps');
  const recommendedWater = targets?.recommended.find(t => t.metricType === 'water_intake');
  const recommendedHeartRate = targets?.recommended.find(t => t.metricType === 'heart_rate');

  useEffect(() => {
    if (targets) {
      const userGlucose = targets.user.find(t => t.metricType === 'glucose');
      const userSteps = targets.user.find(t => t.metricType === 'steps');
      const userWater = targets.user.find(t => t.metricType === 'water_intake');
      const userHeartRate = targets.user.find(t => t.metricType === 'heart_rate');

      // Always show user target if exists, otherwise show recommended
      setGlucoseTarget(userGlucose ? parseFloat(userGlucose.targetValue).toString() : (recommendedGlucose ? parseFloat(recommendedGlucose.targetValue).toString() : ''));
      setStepsTarget(userSteps ? parseFloat(userSteps.targetValue).toString() : (recommendedSteps ? parseFloat(recommendedSteps.targetValue).toString() : ''));
      setWaterTarget(userWater ? parseFloat(userWater.targetValue).toString() : (recommendedWater ? parseFloat(recommendedWater.targetValue).toString() : ''));
      setHeartRateTarget(userHeartRate ? parseFloat(userHeartRate.targetValue).toString() : (recommendedHeartRate ? parseFloat(recommendedHeartRate.targetValue).toString() : ''));
    }
  }, [targets, recommendedGlucose, recommendedSteps, recommendedWater, recommendedHeartRate]);

  const validateTarget = (metricType: string, value: number): string | null => {
    switch (metricType) {
      case 'glucose':
        if (value < 70 || value > 200) {
          return 'Blood glucose target must be between 70-200 mg/dL';
        }
        break;
      case 'steps':
        if (value < 0 || value > 50000) {
          return 'Steps target must be between 0-50,000 steps per day';
        }
        break;
      case 'water_intake':
        if (value < 0 || value > 5) {
          return 'Water intake target must be between 0-5 liters per day';
        }
        break;
      case 'heart_rate':
        if (value < 40 || value > 200) {
          return 'Heart rate target must be between 40-200 bpm';
        }
        break;
    }
    return null;
  };

  const handleSaveAll = async () => {
    const targetsToSave: Array<{ metricType: string; targetValue: number }> = [];
    const errors: string[] = [];

    if (glucoseTarget) {
      const numValue = parseFloat(glucoseTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget('glucose', numValue);
        if (error) {
          errors.push(error);
        } else {
          targetsToSave.push({ metricType: 'glucose', targetValue: numValue });
        }
      }
    }

    if (stepsTarget) {
      const numValue = parseFloat(stepsTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget('steps', numValue);
        if (error) {
          errors.push(error);
        } else {
          targetsToSave.push({ metricType: 'steps', targetValue: numValue });
        }
      }
    }

    if (waterTarget) {
      const numValue = parseFloat(waterTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget('water_intake', numValue);
        if (error) {
          errors.push(error);
        } else {
          targetsToSave.push({ metricType: 'water_intake', targetValue: numValue });
        }
      }
    }

    if (heartRateTarget) {
      const numValue = parseFloat(heartRateTarget);
      if (!isNaN(numValue)) {
        const error = validateTarget('heart_rate', numValue);
        if (error) {
          errors.push(error);
        } else {
          targetsToSave.push({ metricType: 'heart_rate', targetValue: numValue });
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

    if (targetsToSave.length === 0) {
      toast({
        title: 'No targets to save',
        description: 'Please enter at least one target value',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertMutation.mutateAsync(targetsToSave);
    } catch (error: any) {
      // Error toast is handled by the mutation hook
    }
  };

  const handleDelete = async (metricType: string) => {
    await deleteMutation.mutateAsync(metricType);
    // Reset to recommended value if available
    if (metricType === 'glucose' && recommendedGlucose) {
      setGlucoseTarget(parseFloat(recommendedGlucose.targetValue).toString());
    } else if (metricType === 'steps' && recommendedSteps) {
      setStepsTarget(parseFloat(recommendedSteps.targetValue).toString());
    } else if (metricType === 'water_intake' && recommendedWater) {
      setWaterTarget(parseFloat(recommendedWater.targetValue).toString());
    } else if (metricType === 'heart_rate' && recommendedHeartRate) {
      setHeartRateTarget(parseFloat(recommendedHeartRate.targetValue).toString());
    } else {
      if (metricType === 'glucose') setGlucoseTarget('');
      else if (metricType === 'steps') setStepsTarget('');
      else if (metricType === 'water_intake') setWaterTarget('');
      else if (metricType === 'heart_rate') setHeartRateTarget('');
    }
  };

  const hasUserTarget = (metricType: string) => {
    return targets?.user.some(t => t.metricType === metricType) || false;
  };

  const isSubmitting = upsertMutation.isPending || deleteMutation.isPending;

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
          Health Metric Targets
        </CardTitle>
        <CardDescription className="text-sm">
          Set your personal target values for health metrics. If not set, recommended values will be used.
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
                  {hasUserTarget('glucose') && (
                    <span className="ml-2 text-xs text-teal-600">(Custom)</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="glucose-target"
                    type="text"
                    inputMode="numeric"
                    value={glucoseTarget}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(glucoseTarget, e.target.value);
                      setGlucoseTarget(sanitized);
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  {hasUserTarget('glucose') && (
                    <Button
                      onClick={() => handleDelete('glucose')}
                      disabled={isSubmitting}
                      variant="outline"
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {recommendedGlucose && !hasUserTarget('glucose') && `Recommended: ${parseFloat(recommendedGlucose.targetValue)} mg/dL`}
                  {!recommendedGlucose && 'Set your target for blood glucose levels'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps-target" className="text-sm font-medium text-gray-700">
                  Steps Target (per day)
                  {hasUserTarget('steps') && (
                    <span className="ml-2 text-xs text-teal-600">(Custom)</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="steps-target"
                    type="text"
                    inputMode="numeric"
                    value={stepsTarget}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(stepsTarget, e.target.value);
                      setStepsTarget(sanitized);
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  {hasUserTarget('steps') && (
                    <Button
                      onClick={() => handleDelete('steps')}
                      disabled={isSubmitting}
                      variant="outline"
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {recommendedSteps && !hasUserTarget('steps') && `Recommended: ${parseFloat(recommendedSteps.targetValue)} steps/day`}
                  {!recommendedSteps && 'Set your target for daily steps'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="water-target" className="text-sm font-medium text-gray-700">
                  Water Intake Target (liters)
                  {hasUserTarget('water_intake') && (
                    <span className="ml-2 text-xs text-teal-600">(Custom)</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="water-target"
                    type="text"
                    inputMode="numeric"
                    value={waterTarget}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(waterTarget, e.target.value);
                      setWaterTarget(sanitized);
                    }}
                    className="flex-1"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  {hasUserTarget('water_intake') && (
                    <Button
                      onClick={() => handleDelete('water_intake')}
                      disabled={isSubmitting}
                      variant="outline"
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {recommendedWater && !hasUserTarget('water_intake') && `Recommended: ${parseFloat(recommendedWater.targetValue)} liters/day`}
                  {!recommendedWater && 'Set your target for daily water intake'}
                </p>
              </div>

              {isPaidUser && (
                <div className="space-y-2">
                  <Label htmlFor="heart-rate-target" className="text-sm font-medium text-gray-700">
                    Heart Rate Target (bpm)
                    {hasUserTarget('heart_rate') && (
                      <span className="ml-2 text-xs text-teal-600">(Custom)</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="heart-rate-target"
                      type="text"
                      inputMode="numeric"
                      value={heartRateTarget}
                      onChange={(e) => {
                        const sanitized = handleNumberInput(heartRateTarget, e.target.value);
                        setHeartRateTarget(sanitized);
                      }}
                      className="flex-1"
                      disabled={isSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 0, 0, 0.2)',
                      }}
                    />
                    {hasUserTarget('heart_rate') && (
                      <Button
                        onClick={() => handleDelete('heart_rate')}
                        disabled={isSubmitting}
                        variant="outline"
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {recommendedHeartRate && !hasUserTarget('heart_rate') && `Recommended: ${parseFloat(recommendedHeartRate.targetValue)} bpm`}
                    {!recommendedHeartRate && 'Set your target for heart rate'}
                  </p>
                </div>
              )}
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

