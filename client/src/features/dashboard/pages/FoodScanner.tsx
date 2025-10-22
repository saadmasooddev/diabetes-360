import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, ArrowLeft } from 'lucide-react';
import { mockScanResult } from '@/mocks/scanResults';

type ScanStep = 'upload' | 'scanning' | 'results';

export function FoodScanner() {
  const [currentStep, setCurrentStep] = useState<ScanStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleScanClick = () => {
    setCurrentStep('scanning');
  };

  const handleBackClick = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanLinePosition(0);
  };

  // Scanning animation effect
  useEffect(() => {
    if (currentStep === 'scanning') {
      let position = 0;
      let direction = 1;
      
      const interval = setInterval(() => {
        position += direction * 2;
        
        if (position >= 100) {
          direction = -1;
          position = 100;
        } else if (position <= 0) {
          direction = 1;
          position = 0;
        }
        
        setScanLinePosition(position);
      }, 20);

      // Complete scanning after 3 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setCurrentStep('results');
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [currentStep]);

  const getHeaderTitle = () => {
    if (currentStep === 'upload' && previewUrl) return 'Upload Complete';
    if (currentStep === 'scanning') return 'Scanning';
    if (currentStep === 'results') return 'Scan Results';
    return '';
  };

  const showHeader = currentStep !== 'upload' || previewUrl;

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[800px] mx-auto">
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
              {/* Food Name Card */}
              <Card
                className="p-6"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <h2
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#00453A',
                    marginBottom: '8px',
                  }}
                  data-testid="text-food-name"
                >
                  {mockScanResult.foodName}
                </h2>
                <div className="flex gap-4 text-sm" style={{ color: '#546E7A' }}>
                  <span data-testid="text-serving-size">
                    Serving: {mockScanResult.servingSize}
                  </span>
                  <span data-testid="text-calories">
                    {mockScanResult.calories}
                  </span>
                </div>
              </Card>

              {/* Macros Card */}
              <Card
                className="p-6"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#00453A',
                    marginBottom: '16px',
                  }}
                  data-testid="text-macros-title"
                >
                  Macronutrients
                </h3>
                <div className="space-y-3">
                  {mockScanResult.macros.map((macro, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0"
                      data-testid={`row-macro-${index}`}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#546E7A',
                        }}
                      >
                        {macro.name}
                      </span>
                      <div className="flex gap-4 items-center">
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#00453A',
                          }}
                        >
                          {macro.amount}
                        </span>
                        {macro.percentage && (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#00856F',
                              minWidth: '40px',
                              textAlign: 'right',
                            }}
                          >
                            {macro.percentage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Vitamins Card */}
              <Card
                className="p-6"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#00453A',
                    marginBottom: '16px',
                  }}
                  data-testid="text-vitamins-title"
                >
                  Vitamins
                </h3>
                <div className="space-y-3">
                  {mockScanResult.vitamins.map((vitamin, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0"
                      data-testid={`row-vitamin-${index}`}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#546E7A',
                        }}
                      >
                        {vitamin.name}
                      </span>
                      <div className="flex gap-4 items-center">
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#00453A',
                          }}
                        >
                          {vitamin.amount}
                        </span>
                        {vitamin.percentage && (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#00856F',
                              minWidth: '40px',
                              textAlign: 'right',
                            }}
                          >
                            {vitamin.percentage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Minerals Card */}
              <Card
                className="p-6"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#00453A',
                    marginBottom: '16px',
                  }}
                  data-testid="text-minerals-title"
                >
                  Minerals
                </h3>
                <div className="space-y-3">
                  {mockScanResult.minerals.map((mineral, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0"
                      data-testid={`row-mineral-${index}`}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#546E7A',
                        }}
                      >
                        {mineral.name}
                      </span>
                      <div className="flex gap-4 items-center">
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#00453A',
                          }}
                        >
                          {mineral.amount}
                        </span>
                        {mineral.percentage && (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#00856F',
                              minWidth: '40px',
                              textAlign: 'right',
                            }}
                          >
                            {mineral.percentage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Scan Another Button */}
              <Button
                onClick={handleBackClick}
                className="w-full"
                style={{
                  background: '#00856F',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '16px',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  height: 'auto',
                }}
                data-testid="button-scan-another"
              >
                Scan Another Food
              </Button>
            </div>
          ) : (
            /* Upload and Scanning Screen */
            <div className="flex flex-col items-center" style={{ marginTop: showHeader ? '0' : '120px' }}>
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
                    <img
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
                        className="absolute left-0 right-0 h-1 transition-all"
                        style={{
                          top: `${scanLinePosition}%`,
                          background: '#00856F',
                          boxShadow: '0 0 10px rgba(0, 133, 111, 0.6)',
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
