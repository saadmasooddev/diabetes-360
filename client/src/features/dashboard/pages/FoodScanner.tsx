import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { Upload, ArrowLeft, Lock } from 'lucide-react';
import { NutritionProgressBar } from '../components/NutritionProgressBar';
import { useScanFood } from '@/hooks/mutations/useFoodScanner';
import { useAuthStore } from '@/stores/authStore';
import type { ScanResult } from '@/mocks/scanResults';

type ScanStep = 'upload' | 'scanning' | 'results';

interface FoodScannerProps {
  isPremium?: boolean;
}

export function FoodScanner({ isPremium: isPremiumProp }: FoodScannerProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFoodMutation = useScanFood();
  const user = useAuthStore((state) => state.user);
  const isPremium = isPremiumProp ?? (user?.paymentType !== 'free' && user?.paymentType);

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

    setCurrentStep('scanning');

    try {
      const result = await scanFoodMutation.mutateAsync(selectedFile);
      setScanResult(result);
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

  // Scanning animation effect - Smoother version
  useEffect(() => {
    if (currentStep === 'scanning') {
      let position = 0;
      let direction = 1;

      const interval = setInterval(() => {
        position += direction * 0.8; // Smaller increment for smoother movement

        if (position >= 100) {
          direction = -1;
          position = 100;
        } else if (position <= 0) {
          direction = 1;
          position = 0;
        }

        setScanLinePosition(position);
      }, 10); // More frequent updates (10ms instead of 20ms)

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
            /* Results Screen - New Figma Design */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="container-results">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Food Overview */}
                <Card
                  className="p-6"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  data-testid="card-food-overview"
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#00453A',
                      marginBottom: '20px',
                    }}
                  >
                    Food Overview
                  </h3>
                  <div className="flex gap-4">
                    <Image
                      src={scanResult?.foodImage || previewUrl || ''}
                      alt="Food"
                      className="w-32 h-32 rounded-2xl object-cover"
                      data-testid="img-food-overview"
                    />
                    <div className="flex flex-col justify-center gap-3">
                      <div>
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#546E7A',
                            marginBottom: '4px',
                          }}
                        >
                          Food Name
                        </p>
                        <p
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#00453A',
                          }}
                          data-testid="text-food-name"
                        >
                          {scanResult?.foodName || 'Loading...'}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#546E7A',
                            marginBottom: '4px',
                          }}
                        >
                          Food Category
                        </p>
                        <p
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#00453A',
                          }}
                          data-testid="text-food-category"
                        >
                          {scanResult?.foodCategory || 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Breakdown Section */}
                <Card
                  className="p-6"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  data-testid="card-breakdown"
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#00453A',
                      marginBottom: '20px',
                    }}
                  >
                    Breakdown Section
                  </h3>
                  <div>
                    {scanResult ? (
                      <>
                        <NutritionProgressBar item={scanResult.breakdown.carbs} />
                        <NutritionProgressBar item={scanResult.breakdown.fiber} />
                        <NutritionProgressBar item={scanResult.breakdown.sugars} />
                        <NutritionProgressBar item={scanResult.breakdown.protein} />
                        <NutritionProgressBar item={scanResult.breakdown.fat} />
                        <NutritionProgressBar item={scanResult.breakdown.calories} />
                      </>
                    ) : (
                      <p>Loading breakdown...</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Nutritional Highlight */}
                <Card
                  className="p-6"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  data-testid="card-nutritional-highlight"
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#00453A',
                      marginBottom: '20px',
                    }}
                  >
                    Nutritional Highlight
                  </h3>

                  <Image
                    src={scanResult?.foodImage || previewUrl || ''}
                    alt="Food highlight"
                    className="w-full h-48 rounded-2xl object-cover mb-4"
                    data-testid="img-nutritional-highlight"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Carbohydrate Count */}
                    <div>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#546E7A',
                          marginBottom: '8px',
                        }}
                      >
                        Carbohydrate Count
                      </p>
                      <p
                        style={{
                          fontSize: '32px',
                          fontWeight: 700,
                          color: '#00453A',
                        }}
                        data-testid="text-carb-count"
                      >
                        {scanResult?.nutritionalHighlight.carbohydrateCount || 'Loading...'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* Upload and Scanning Screen */
            <div className="flex flex-col items-center max-w-[800px] mx-auto" style={{ marginTop: showHeader ? '0' : '120px' }}>
              {/* Upload/Scanning Area */}
              <Card
                className={`w-full mb-8 relative overflow-hidden ${!previewUrl ? 'cursor-pointer hover:border-[#00856F]' : ''} transition-colors`}
                style={{
                  background: '#FFFFFF',
                  border: '2px dashed rgba(0, 0, 0, 0.1)',
                  borderRadius: '24px',
                  minHeight: '400px',
                  padding: '0',
                }}
                onClick={!previewUrl ? handleUploadClick : undefined}
                data-testid="card-upload-area"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full min-h-[400px]">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-[24px]"
                      style={{
                        filter: currentStep === 'scanning' ? 'grayscale(70%) brightness(0.8)' : 'none',
                      }}
                      data-testid="img-preview"
                    />

                    {/* Scanning Line Animation */}
                    {currentStep === 'scanning' && (
                      <div
                        className="absolute left-0 right-0 h-1"
                        style={{
                          top: `${scanLinePosition}%`,
                          background: '#00856F',
                          boxShadow: '0 0 10px rgba(0, 133, 111, 0.6)',
                          transition: 'top 0.05s linear',
                        }}
                        data-testid="scan-line"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] p-12">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: '120px',
                        height: '120px',
                        background: '#F7F9F9',
                      }}
                      data-testid="icon-upload-container"
                    >
                      <Upload size={48} color="#00856F" strokeWidth={2} />
                    </div>
                    <p
                      style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#546E7A',
                      }}
                      data-testid="text-upload-instruction"
                    >
                      Click to upload a food picture
                    </p>
                  </div>
                )}
              </Card>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />

              {/* Action Button */}
              {!previewUrl ? (
                <Button
                  onClick={handleUploadClick}
                  className="w-full max-w-[400px]"
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    height: 'auto',
                  }}
                  data-testid="button-upload-picture"
                >
                  Upload Picture
                </Button>
              ) : currentStep === 'upload' ? (
                <Button
                  onClick={handleScanClick}
                  disabled={scanFoodMutation.isPending}
                  className="w-full max-w-[400px]"
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    height: 'auto',
                  }}
                  data-testid="button-scan"
                >
                  Scan
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full max-w-[400px]"
                  style={{
                    background: '#00856F',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    height: 'auto',
                    opacity: 0.8,
                  }}
                  data-testid="button-scanning"
                >
                  Scanning..
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
