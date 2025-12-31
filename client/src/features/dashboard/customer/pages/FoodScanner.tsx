import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { useScanFood, useUserDailyData, useConsumedNutrients } from '@/hooks/mutations/useFoodScanner';
import { useFoodScanStatus } from '@/hooks/mutations/useSettings';
import { useAuthStore } from '@/stores/authStore';
import type { ScanResult } from '@/mocks/scanResults';
import { UploadArea } from '../../components/FoodScanner/UploadArea';
import { ScanningAnimation } from '../../components/FoodScanner/ScanningAnimation';
import { FoodOverview } from '../../components/FoodScanner/FoodOverview';
import { PersonalizedInsight } from '../../components/FoodScanner/PersonalizedInsight';
import { BreakdownSection } from '../../components/FoodScanner/BreakdownSection';
import { NutritionalHighlight } from '../../components/FoodScanner/NutritionalHighlight';
import { toast } from '@/hooks/use-toast';

type ScanStep = 'upload' | 'scanning' | 'results';


export function FoodScanner() {
  const [currentStep, setCurrentStep] = useState<ScanStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFoodMutation = useScanFood();
  const user = useAuthStore((state) => state.user);
  const isPremium = user?.paymentType !== 'free';
  const { data: scanStatus, refetch: refetchScanStatus } = useFoodScanStatus();
  const { data: nutritionRequirements, isLoading: isLoadingRequirements, isError: isErrorRequirements } = useUserDailyData();
  const consumedNutrients = scanResult?.consumed

  useEffect(() => {
    if (isErrorRequirements) {
      toast({
        title: 'Failed to Load Nutrition Requirements',
        description: 'Failed to load nutrition requirements. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isErrorRequirements, toast])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleScanClick = async () => {
    if (!selectedFile) return;

    // Check if user can scan
    if (scanStatus && !scanStatus.canScan) {
      return;
    }

    setCurrentStep('scanning');

    try {
      const result = await scanFoodMutation.mutateAsync(selectedFile);
      setScanResult(result);
      // Refetch scan status after successful scan
      refetchScanStatus();
      // Wait for animation to complete before showing results
      setTimeout(() => {
        setCurrentStep('results');
      }, 3000);
    } catch (error) {
      // Error is handled by the mutation hook (toast notification)
      setCurrentStep('upload');
    }
  };

  const handleBackClick = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanLinePosition(0);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Scanning animation effect
  useEffect(() => {
    if (currentStep === 'scanning') {
      let position = 0;
      let direction = 1;

      const interval = setInterval(() => {
        position += direction * 0.8;

        if (position >= 100) {
          direction = -1;
          position = 100;
        } else if (position <= 0) {
          direction = 1;
          position = 0;
        }

        setScanLinePosition(position);
      }, 10);

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentStep]);

  const getHeaderTitle = () => {
    if (currentStep === 'upload' && previewUrl) return 'Upload Complete';
    if (currentStep === 'scanning') return 'Scanning';
    if (currentStep === 'results') return 'Results';
    return '';
  };

  const showHeader = currentStep !== 'upload' || previewUrl;

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Header with back button */}
          {showHeader && (
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft size={24} color="#00856F" />
              </button>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#00856F',
                }}
                data-testid="text-header-title"
              >
                {getHeaderTitle()}
              </h1>
            </div>
          )}

          {currentStep === 'results' ? (
            /* Results Screen */
            <div className="space-y-6" data-testid="container-results">
              {/* Top Row: Food Overview + Personalized Insight */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FoodOverview scanResult={scanResult} previewUrl={previewUrl} />
                <PersonalizedInsight scanResult={scanResult} isPremium={isPremium} />
              </div>

              {/* Bottom Row: Breakdown Section + Nutritional Highlight */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BreakdownSection
                  scanResult={scanResult}
                  nutritionRequirements={nutritionRequirements}
                  consumedNutrients={consumedNutrients}
                />
                <NutritionalHighlight
                  scanResult={scanResult}
                  previewUrl={previewUrl}
                  isPremium={isPremium}
                />
              </div>
            </div>
          ) : currentStep === 'scanning' ? (
            /* Scanning Screen */
            <div
              className="flex flex-col items-center max-w-[800px] mx-auto"
              style={{ marginTop: showHeader ? '0' : '120px' }}
              data-testid="container-scanning"
            >
              <ScanningAnimation previewUrl={previewUrl} scanLinePosition={scanLinePosition} />
            </div>
          ) : (
            /* Upload Screen */
            <div
              className="flex flex-col items-center max-w-[800px] mx-auto"
              style={{ marginTop: showHeader ? '0' : '120px' }}
              data-testid="container-upload"
            >
              <UploadArea
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onUploadClick={handleUploadClick}
                onScanClick={handleScanClick}
                isScanning={false}
                isPending={scanFoodMutation.isPending}
                canScan={scanStatus?.canScan ?? true}
                limitMessage={
                  scanStatus && !scanStatus.canScan
                    ? `Daily limit reached. You have used ${scanStatus.currentCount} out of ${scanStatus.limit} scans today.`
                    : undefined
                }
              />
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
