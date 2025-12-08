import { Card } from '@/components/ui/card';

interface ScanningAnimationProps {
  previewUrl: string | null;
  scanLinePosition: number;
}

export function ScanningAnimation({ previewUrl, scanLinePosition }: ScanningAnimationProps) {
  return (
    <div className="flex flex-col items-center max-w-[800px] mx-auto">
      <Card
        className="w-full mb-8 relative overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '2px dashed rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          minHeight: '400px',
          padding: '0',
        }}
        data-testid="card-scanning-area"
      >
        {previewUrl && (
          <div className="relative w-full h-full min-h-[400px]">
            <img
              src={previewUrl}
              alt="Scanning"
              className="w-full h-full object-cover rounded-[24px]"
              style={{
                filter: 'grayscale(70%) brightness(0.8)',
              }}
              data-testid="img-scanning"
            />
            {/* Scanning Line Animation */}
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
          </div>
        )}
      </Card>
    </div>
  );
}

