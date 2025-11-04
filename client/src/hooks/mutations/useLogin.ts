import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { LoginRequest, AuthData } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { ROUTES } from '@/config/routes';

export const useLogin = () => {
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [, navigate] = useLocation();

  return useMutation<AuthData, Error, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
        variant: 'default',
      });
      
      // Redirect based on profile completion
      if (!data.user.profileComplete && data.user.role === 'customer') {
        navigate(ROUTES.PROFILE_DATA);
      } else {
        navigate(ROUTES.HOME);
      }
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
