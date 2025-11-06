import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFreeTierLimits, useUpdateFreeTierLimits, useCreateFreeTierLimits } from '@/hooks/mutations/useSettings';
import { Settings } from 'lucide-react';

export function FreeTierLimitsManagement() {
  const { data: limits, isLoading } = useFreeTierLimits();
  const updateMutation = useUpdateFreeTierLimits();
  const createMutation = useCreateFreeTierLimits();

  const [glucoseLimit, setGlucoseLimit] = useState<number>(2);
  const [stepsLimit, setStepsLimit] = useState<number>(2);
  const [waterLimit, setWaterLimit] = useState<number>(2);

  useEffect(() => {
    if (limits) {
      setGlucoseLimit(limits.glucoseLimit);
      setStepsLimit(limits.stepsLimit);
      setWaterLimit(limits.waterLimit);
    }
  }, [limits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      glucoseLimit: Number(glucoseLimit),
      stepsLimit: Number(stepsLimit),
      waterLimit: Number(waterLimit),
    };

    if (limits) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = updateMutation.isPending || createMutation.isPending;

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
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
          Free Tier Limits Management
        </CardTitle>
        <CardDescription className="text-sm">
          Configure daily logging limits for free tier users. Each metric type has its own limit.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading limits...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="glucose-limit" className="text-sm font-medium text-gray-700">
                  Glucose Limit (per day)
                </Label>
                <Input
                  id="glucose-limit"
                  type="number"
                  min="0"
                  value={glucoseLimit}
                  onChange={(e) => setGlucoseLimit(Number(e.target.value))}
                  required
                  className="w-full"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of glucose logs free tier users can create per day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps-limit" className="text-sm font-medium text-gray-700">
                  Steps Limit (per day)
                </Label>
                <Input
                  id="steps-limit"
                  type="number"
                  min="0"
                  value={stepsLimit}
                  onChange={(e) => setStepsLimit(Number(e.target.value))}
                  required
                  className="w-full"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of steps logs free tier users can create per day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="water-limit" className="text-sm font-medium text-gray-700">
                  Water Intake Limit (per day)
                </Label>
                <Input
                  id="water-limit"
                  type="number"
                  min="0"
                  value={waterLimit}
                  onChange={(e) => setWaterLimit(Number(e.target.value))}
                  required
                  className="w-full"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of water intake logs free tier users can create per day
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (limits) {
                    setGlucoseLimit(limits.glucoseLimit);
                    setStepsLimit(limits.stepsLimit);
                    setWaterLimit(limits.waterLimit);
                  }
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                style={{
                  minWidth: '120px',
                }}
              >
                {isSubmitting ? 'Saving...' : limits ? 'Update Limits' : 'Create Limits'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

