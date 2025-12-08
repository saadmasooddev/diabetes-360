import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import type { LoginRequest, AuthData } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'wouter';
import { ROUTES } from '@/config/routes';
import { userService } from '@/services/userService';

export const useLogin = () => {
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [, navigate] = useLocation();

  return useMutation<AuthData, Error, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // If 2FA is required, don't set auth or redirect yet
      if (data.requiresTwoFactor) {
        return; // Let the component handle 2FA verification
      }

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

export const useVerify2FALogin = () => {
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [, navigate] = useLocation();

  return useMutation<AuthData, Error, { email: string; token: string }>({
    mutationFn: ({ email, token }) => authService.verify2FALogin(email, token),
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
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getUserProfile(),
  });
}