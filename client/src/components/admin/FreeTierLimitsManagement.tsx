import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { handleNumberInput } from '@/lib/utils';
import { ButtonSpinner } from '@/components/ui/spinner';
import { useCreateLimits, useLimits, useUpdateLimits } from '@/hooks/mutations/useSettings';

export function FreeTierLimitsManagement() {
  const { data: limits, isLoading } = useLimits()
  const updateMutation = useUpdateLimits();
  const createMutation = useCreateLimits();

  const [glucoseLimit, setGlucoseLimit] = useState<string>('2');
  const [stepsLimit, setStepsLimit] = useState<string>('2');
  const [waterLimit, setWaterLimit] = useState<string>('2');
  const [discountedConsultationQuota, setDiscountedConsultationQuota] = useState<string>('0');
  const [freeConsultationQuota, setFreeConsultationQuota] = useState<string>('0');
  const [freeUserLimit, setFreeUserLimit] = useState<string>('0');
  const [paidUserLimit, setPaidUserLimit] = useState<string>('0');

  useEffect(() => {
    if (limits) {
      setGlucoseLimit(String(limits.glucoseLimit));
      setStepsLimit(String(limits.stepsLimit));
      setWaterLimit(String(limits.waterLimit));
      setDiscountedConsultationQuota(String(limits.discountedConsultationQuota || 0));
      setFreeConsultationQuota(String(limits.freeConsultationQuota || 0));
      if (limits.foodScanLimits) {
        setFreeUserLimit(String(limits.foodScanLimits.freeTier));
        setPaidUserLimit(String(limits.foodScanLimits.paidTier));
      }
    }
  }, [limits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      glucoseLimit: Number(glucoseLimit) || 0,
      stepsLimit: Number(stepsLimit) || 0,
      waterLimit: Number(waterLimit) || 0,
      discountedConsultationQuota: Number(discountedConsultationQuota) || 0,
      freeConsultationQuota: Number(freeConsultationQuota) || 0,
      freeUserScanLimit: Number(freeUserLimit) || 0,
      paidUserScanLimit: Number(paidUserLimit) || 0,
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
          Limits Management
        </CardTitle>
        <CardDescription className="text-sm">
          Configure daily logging limits for health metrics, food scanning, and consultation quotas for new users.
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
                  type="text"
                  inputMode="numeric"
                  min="0"
                  value={glucoseLimit}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(glucoseLimit, e.target.value);
                    setGlucoseLimit(sanitized);
                  }}
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
                  type="text"
                  inputMode="numeric"
                  min="0"
                  value={stepsLimit}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(stepsLimit, e.target.value);
                    setStepsLimit(sanitized);
                  }}
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
                  type="text"
                  inputMode="numeric"
                  min="0"
                  value={waterLimit}
                  onChange={(e) => {
                    const sanitized = handleNumberInput(waterLimit, e.target.value);
                    setWaterLimit(sanitized);
                  }}
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

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Consultation Quotas (for new users)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="discounted-quota" className="text-sm font-medium text-gray-700">
                    Discounted Consultation Quota
                  </Label>
                  <Input
                    id="discounted-quota"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={discountedConsultationQuota}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(discountedConsultationQuota, e.target.value);
                      setDiscountedConsultationQuota(sanitized);
                    }}
                    required
                    className="w-full"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Number of discounted consultations (20% off) available for new paid users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="free-quota" className="text-sm font-medium text-gray-700">
                    Free Consultation Quota
                  </Label>
                  <Input
                    id="free-quota"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={freeConsultationQuota}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(freeConsultationQuota, e.target.value);
                      setFreeConsultationQuota(sanitized);
                    }}
                    required
                    className="w-full"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Number of free consultations available for new annual paid users
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: These quotas apply to all new users. Existing users will continue on their old quotas.
              </p>
            </div>

            <Separator />

            <div className="pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Food Scanner Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="free-user-limit" className="text-sm font-medium text-gray-700">
                    Free User Daily Limit
                  </Label>
                  <Input
                    id="free-user-limit"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={freeUserLimit}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(freeUserLimit, e.target.value);
                      setFreeUserLimit(sanitized);
                    }}
                    required
                    className="w-full"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of food scans per day for free tier users
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paid-user-limit" className="text-sm font-medium text-gray-700">
                    Paid User Daily Limit
                  </Label>
                  <Input
                    id="paid-user-limit"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={paidUserLimit}
                    onChange={(e) => {
                      const sanitized = handleNumberInput(paidUserLimit, e.target.value);
                      setPaidUserLimit(sanitized);
                    }}
                    required
                    className="w-full"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of food scans per day for paid users (monthly/annual subscriptions)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (limits) {
                    setGlucoseLimit(String(limits.glucoseLimit));
                    setStepsLimit(String(limits.stepsLimit));
                    setWaterLimit(String(limits.waterLimit));
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
                {isSubmitting ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Saving...
                  </>
                ) : limits ? (
                  'Update Limits'
                ) : (
                  'Create Limits'
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

