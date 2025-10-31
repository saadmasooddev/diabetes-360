import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

export const useResetPassword = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => 
      authService.resetPassword(token, password),
    onSuccess: () => {
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset successfully. You can now log in with your new password.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Unable to reset password. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
