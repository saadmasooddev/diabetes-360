import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { SignupRequest, AuthData } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { ROUTES } from '@/config/routes';

export const useSignup = () => {
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [, navigate] = useLocation();

  return useMutation<AuthData, Error, SignupRequest>({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens);
      toast({
        title: 'Success!',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });
      navigate(ROUTES.HOME);
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
