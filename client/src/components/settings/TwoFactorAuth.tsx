import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTwoFactorStatus, useSetup2FA, useVerifyAndEnable2FA, useDisable2FA, useRegenerateBackupCodes } from '@/hooks/mutations/useTwoFactor';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function TwoFactorAuth() {
  const { data: status, isLoading: isLoadingStatus } = useTwoFactorStatus();
  const setupMutation = useSetup2FA();
  const verifyMutation = useVerifyAndEnable2FA();
  const disableMutation = useDisable2FA();
  const regenerateMutation = useRegenerateBackupCodes();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isEnabled = status?.enabled && status?.verified;
  const isSettingUp = setupMutation.isPending || verifyMutation.isPending;

  const handleSetup = async () => {
    try {
      const result = await setupMutation.mutateAsync();
      setBackupCodes(result.backupCodes);
      setShowSetupDialog(true);
      setShowBackupCodesDialog(true);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      return;
    }

    try {
      await verifyMutation.mutateAsync({ token: verificationCode });
      setShowVerifyDialog(false);
      setShowSetupDialog(false);
      setVerificationCode('');
    } catch (error) {
      // Error handled by mutation hook
      setVerificationCode('');
    }
  };

  const handleDisable = async () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      try {
        await disableMutation.mutateAsync();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      const codes = await regenerateMutation.mutateAsync();
      setBackupCodes(codes);
      setShowBackupCodesDialog(true);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoadingStatus) {
    return (
      <Card className="overflow-hidden max-w-full  ">
        <CardHeader className="p-4 sm:p-6 lg:p-6 ">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-sm">
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-6 pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden max-w-full bg-white ">
        <CardHeader className="p-4 sm:p-6 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-sm">
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-sm sm:text-base text-gray-900">
                  Two-Factor Authentication
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {isEnabled
                    ? 'Enabled - Your account is protected with 2FA'
                    : 'Disabled - Enable to add an extra layer of security'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <>
                  <span className="text-xs sm:text-sm text-teal-700 font-medium">Enabled</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisable}
                    disabled={disableMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {disableMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      'Disable'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateBackupCodes}
                    disabled={regenerateMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {regenerateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate Codes'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSetup}
                  disabled={isSettingUp}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Enable 2FA'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog with QR Code */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            {setupMutation.data && (
              <>
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img
                    src={setupMutation.data.qrCodeUrl}
                    alt="QR Code for 2FA"
                    className="w-64 h-64"
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-900">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Save your backup codes in a secure location</li>
                        <li>Each backup code can only be used once</li>
                        <li>If you lose access to your authenticator app, use backup codes to regain access</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setShowSetupDialog(false);
                      setShowVerifyDialog(true);
                    }}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    I've scanned the QR code
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[400px]">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">Verify Setup</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter the 6-digit code from your authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={(value) => setVerificationCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || verifyMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">Backup Codes</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Save these codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <code className="text-sm font-mono text-gray-900">{code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code, index)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-teal-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-900">
                  These codes will not be shown again. Make sure to save them securely.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowBackupCodesDialog(false)}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
            >
              I've saved my backup codes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

