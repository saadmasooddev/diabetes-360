import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFoodScanLimits, useUpdateFoodScanLimits, useCreateFoodScanLimits } from '@/hooks/mutations/useSettings';
import { Settings } from 'lucide-react';
import { handleNumberInput } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/spinner';

export function FoodScanLimitsManagement() {
  const { data: limits, isLoading } = useFoodScanLimits();
  const updateMutation = useUpdateFoodScanLimits();
  const createMutation = useCreateFoodScanLimits();

  const [freeUserLimit, setFreeUserLimit] = useState<string>('5');
  const [paidUserLimit, setPaidUserLimit] = useState<string>('20');

  useEffect(() => {
    if (limits) {
      setFreeUserLimit(String(limits.freeUserLimit));
      setPaidUserLimit(String(limits.paidUserLimit));
    }
  }, [limits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      freeUserLimit: Number(freeUserLimit) || 0,
      paidUserLimit: Number(paidUserLimit) || 0,
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
          Food Scanner Limits Management
        </CardTitle>
        <CardDescription className="text-sm">
          Configure daily food scanning limits for free and paid users. Limits are reset daily at midnight.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {isLoading ? (
          <div className="text-center py-8">
            <ButtonSpinner className="mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Loading limits...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="freeUserLimit"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Free User Daily Limit
                </Label>
                <Input
                  id="freeUserLimit"
                  type="text"
                  value={freeUserLimit}
                  onChange={(e) => handleNumberInput(e, setFreeUserLimit)}
                  placeholder="5"
                  className="h-10"
                  required
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of food scans per day for free tier users
                </p>
              </div>

              <div>
                <Label
                  htmlFor="paidUserLimit"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Paid User Daily Limit
                </Label>
                <Input
                  id="paidUserLimit"
                  type="text"
                  value={paidUserLimit}
                  onChange={(e) => handleNumberInput(e, setPaidUserLimit)}
                  placeholder="20"
                  className="h-10"
                  required
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of food scans per day for paid users (monthly/annual subscriptions)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none sm:min-w-[120px] h-10 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Limits'
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
