import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export const useForgotPassword = () => {
  const { toast } = useToast();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast({
        title: 'Email Sent',
        description: 'Check your email for a password reset link.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Request Failed',
        description: error.message || 'Unable to send reset link. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
