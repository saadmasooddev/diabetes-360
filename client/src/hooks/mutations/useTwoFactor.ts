import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { twoFactorService } from '@/services/twoFactorService';
import type {
  TwoFactorStatus,
  Setup2FAResponse,
  Verify2FARequest,
} from '@/services/twoFactorService';
import { useToast } from '@/hooks/use-toast';

export const useTwoFactorStatus = () => {
  return useQuery<TwoFactorStatus, Error>({
    queryKey: ['twoFactor', 'status'],
    queryFn: () => twoFactorService.getStatus(),
    retry: false,
  });
};

export const useSetup2FA = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<Setup2FAResponse, Error>({
    mutationFn: () => twoFactorService.setup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twoFactor'] });
      toast({
        title: '2FA Setup Started',
        description: 'Scan the QR code with your authenticator app.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup 2FA. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useVerifyAndEnable2FA = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<{ verified: boolean }, Error, Verify2FARequest>({
    mutationFn: (data) => twoFactorService.verifyAndEnable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twoFactor'] });
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled.',
        variant: 'default',
      });
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

export const useDisable2FA = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => twoFactorService.disable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twoFactor'] });
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Disable Failed',
        description: error.message || 'Failed to disable 2FA. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useRegenerateBackupCodes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<string[], Error>({
    mutationFn: () => twoFactorService.regenerateBackupCodes(),
    onSuccess: (backupCodes) => {
      queryClient.invalidateQueries({ queryKey: ['twoFactor'] });
      toast({
        title: 'Backup Codes Regenerated',
        description: `New backup codes have been generated. Please save them securely.`,
        variant: 'default',
      });
      return backupCodes;
    },
    onError: (error) => {
      toast({
        title: 'Regeneration Failed',
        description: error.message || 'Failed to regenerate backup codes. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

