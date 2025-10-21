import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { SignupRequest, AuthResponse } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { ROUTES } from '@/config/routes';

export const useSignup = () => {
  const { toast } = useToast();
  const setUser = useAuthStore((state: ReturnType<typeof useAuthStore.getState>) => state.setUser);
  const [, navigate] = useLocation();

  return useMutation<AuthResponse, Error, SignupRequest>({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: 'Success!',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast({
        title: 'Signup Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
