import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { LoginRequest, AuthResponse } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { ROUTES } from '@/config/routes';

export const useLogin = () => {
  const { toast } = useToast();
  const setUser = useAuthStore((state: ReturnType<typeof useAuthStore.getState>) => state.setUser);
  const [, navigate] = useLocation();

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
        variant: 'default',
      });
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
