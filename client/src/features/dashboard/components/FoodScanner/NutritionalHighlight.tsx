import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import type { ScanResult } from '@/mocks/scanResults';

interface NutritionalHighlightProps {
  scanResult: ScanResult | null;
  previewUrl: string | null;
  isPremium: boolean;
}

// Helper functions to determine GI styling
const normalizeGI = (gi: string | null | undefined): 'low' | 'medium' | 'high' | null => {
  if (!gi) return null;
  const normalized = gi.toLowerCase().trim();
  if (normalized.includes('low')) return 'low';
  if (normalized.includes('medium') || normalized.includes('mid')) return 'medium';
  if (normalized.includes('high')) return 'high';
  return null;
};

const getGIBackground = (type: 'low' | 'medium' | 'high', currentGI: string | null | undefined): string => {
  const normalized = normalizeGI(currentGI);
  if (normalized === type) {
    if (type === 'low') return '#D1FAE5';
    if (type === 'medium') return '#FEF3C7';
    return '#FEE2E2';
  }
  return '#E0F2F1';
};

const getGIBorder = (type: 'low' | 'medium' | 'high', currentGI: string | null | undefined): string => {
  const normalized = normalizeGI(currentGI);
  if (normalized === type) {
    if (type === 'low') return '2px solid #10B981';
    if (type === 'medium') return '2px solid #F59E0B';
    return '2px solid #DC2626';
  }
  return '2px solid transparent';
};

const getGIColor = (type: 'low' | 'medium' | 'high', currentGI: string | null | undefined): string => {
  const normalized = normalizeGI(currentGI);
  if (normalized === type) {
    if (type === 'low') return '#10B981';
    if (type === 'medium') return '#F59E0B';
    return '#DC2626';
  }
  return '#00453A';
};

const getGIFontWeight = (type: 'low' | 'medium' | 'high', currentGI: string | null | undefined): number => {
  const normalized = normalizeGI(currentGI);
  return normalized === type ? 700 : 500;
};

// Removed transform to keep equal sizes - using border and shadow for emphasis instead

const getGIShadow = (type: 'low' | 'medium' | 'high', currentGI: string | null | undefined): string => {
  const normalized = normalizeGI(currentGI);
  if (normalized === type) {
    if (type === 'low') return '0 2px 8px rgba(16, 185, 129, 0.3)';
    if (type === 'medium') return '0 2px 8px rgba(245, 158, 11, 0.3)';
    return '0 2px 8px rgba(220, 38, 38, 0.3)';
  }
  return 'none';
};

export function NutritionalHighlight({
  scanResult,
  previewUrl,
  isPremium,
}: NutritionalHighlightProps) {
  const highlight = scanResult?.nutritionalHighlight;

  return (
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
          marginBottom: '16px',
        }}
      >
        Nutritional Highlight
      </h3>

      {/* Food Image - Large */}
      <div className="mb-4">
        <img
          src={
            previewUrl ||
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=300&fit=crop'
          }
          alt="Food"
          className="w-full rounded-xl object-cover"
          style={{ height: '200px' }}
          data-testid="img-nutritional-highlight"
        />
      </div>

      {/* Carbohydrate Count and Glycemic Index Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Carbohydrate Count Card */}
        <div
          className="p-4 rounded-xl"
          style={{ background: '#F5F5F5' }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#00453A',
              marginBottom: '12px',
            }}
          >
            Carbohydrate Count
          </p>
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#00453A',
              }}
            >
              {highlight?.carbohydrateCount || '0g'}
            </span>
            {/* Filled Up Triangle */}
            <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
              <path d="M16 0L32 28H0L16 0Z" fill="#00453A" />
            </svg>
          </div>
        </div>

        {/* Glycemic Index Card */}
        <div
          className="p-4 rounded-xl relative"
          style={{ background: '#F5F5F5' }}
        >
          {!isPremium && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
              style={{ background: 'rgba(245, 245, 245, 0.95)' }}
            >
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: '#E8F5F3' }}
                >
                  <Lock size={18} color="#00856F" />
                </div>
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: '#546E7A',
                  }}
                >
                  Premium
                </p>
              </div>
            </div>
          )}

          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#00453A',
              marginBottom: '16px',
            }}
          >
            Glycemic Index
          </p>
          <div className="flex items-center gap-2" style={{ height: '48px' }}>
            {/* Low GI Pill */}
            <div
              className="flex-1 rounded-lg flex items-center justify-center gap-1 transition-all"
              style={{
                background: getGIBackground('low', highlight?.glycemicIndex),
                border: getGIBorder('low', highlight?.glycemicIndex),
                boxShadow: getGIShadow('low', highlight?.glycemicIndex),
                height: '48px',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: getGIFontWeight('low', highlight?.glycemicIndex),
                  color: getGIColor('low', highlight?.glycemicIndex),
                  whiteSpace: 'nowrap',
                }}
              >
                Low
              </span>
              {/* Down Triangle */}
              {/* <svg width="10" height="8" viewBox="0 0 10 8" fill="none" style={{ flexShrink: 0 }}>
                <path
                  d="M10 18L0 0H20L10 18Z"
                  fill={getGIColor('low', highlight?.glycemicIndex)}
                />
              </svg> */}
            </div>

            {/* Medium GI Pill */}
            <div
              className="flex-1 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: getGIBackground('medium', highlight?.glycemicIndex),
                border: getGIBorder('medium', highlight?.glycemicIndex),
                boxShadow: getGIShadow('medium', highlight?.glycemicIndex),
                height: '48px',
                minWidth: 0,
              }}
            >
              <span
                className=' text-[0.5rem] sm:text-[10px]'
                style={{
                  fontWeight: getGIFontWeight('medium', highlight?.glycemicIndex),
                  color: getGIColor('medium', highlight?.glycemicIndex),
                  whiteSpace: 'nowrap',
                }}
              >
                Medium
              </span>
              {/* Horizontal Line (Medium) */}
              {/* <svg width="16" height="4" viewBox="0 0 20 4" fill="none" style={{ flexShrink: 0 }}>
                <rect width="20" height="4" rx="2" fill={getGIColor('medium', highlight?.glycemicIndex)} />
              </svg> */}
            </div>

            {/* High GI Pill */}
            <div
              className="flex-1 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: getGIBackground('high', highlight?.glycemicIndex),
                border: getGIBorder('high', highlight?.glycemicIndex),
                boxShadow: getGIShadow('high', highlight?.glycemicIndex),
                height: '48px',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: getGIFontWeight('high', highlight?.glycemicIndex),
                  color: getGIColor('high', highlight?.glycemicIndex),
                  whiteSpace: 'nowrap',
                }}
              >
                High
              </span>
              {/* Up Triangle */}
              {/* <svg width="16" height="14" viewBox="0 0 20 18" fill="none" style={{ flexShrink: 0 }}>
                <path
                  d="M10 0L20 18H0L10 0Z"
                  fill={getGIColor('high', highlight?.glycemicIndex)}
                />
              </svg> */}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

