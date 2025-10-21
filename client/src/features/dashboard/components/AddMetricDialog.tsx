import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { healthService } from '../services/healthService';
import { insertHealthMetricSchema } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { API_ENDPOINTS } from '@/config/endpoints';
import { useAuthStore } from '@/stores/authStore';

const formSchema = insertHealthMetricSchema.extend({
  bloodSugar: z.string().optional(),
  bloodPressureSystolic: z.string().optional(),
  bloodPressureDiastolic: z.string().optional(),
  heartRate: z.string().optional(),
  weight: z.string().optional(),
  steps: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMetricDialog({ open, onOpenChange }: AddMetricDialogProps) {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id || '',
      bloodSugar: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      weight: '',
      steps: '',
    },
  });

  const addMetricMutation = useMutation({
    mutationFn: healthService.addMetric,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Health metrics added successfully',
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.HEALTH.LATEST, user?.id] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.HEALTH.METRICS, user?.id] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add metrics',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      userId: user?.id || '',
      bloodSugar: data.bloodSugar ? data.bloodSugar : null,
      bloodPressureSystolic: data.bloodPressureSystolic ? parseInt(data.bloodPressureSystolic) : null,
      bloodPressureDiastolic: data.bloodPressureDiastolic ? parseInt(data.bloodPressureDiastolic) : null,
      heartRate: data.heartRate ? parseInt(data.heartRate) : null,
      weight: data.weight ? data.weight : null,
      steps: data.steps ? parseInt(data.steps) : null,
    };
    addMetricMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-add-metric">
        <DialogHeader>
          <DialogTitle>Add Health Metrics</DialogTitle>
          <DialogDescription>
            Enter your health measurements. Leave fields empty if not measured.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bloodSugar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Sugar (mg/dL)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="120"
                      {...field}
                      data-testid="input-blood-sugar"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bloodPressureSystolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BP Systolic</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        {...field}
                        data-testid="input-bp-systolic"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressureDiastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BP Diastolic</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="80"
                        {...field}
                        data-testid="input-bp-diastolic"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="heartRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heart Rate (bpm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="72"
                      {...field}
                      data-testid="input-heart-rate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      {...field}
                      data-testid="input-weight"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10000"
                      {...field}
                      data-testid="input-steps"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={addMetricMutation.isPending}
                data-testid="button-submit-metrics"
              >
                {addMetricMutation.isPending ? 'Adding...' : 'Add Metrics'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
