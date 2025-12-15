import { Lock } from 'lucide-react';
import type { BreakdownItem } from '@/mocks/scanResults';

interface EnhancedNutritionProgressBarProps {
  item: BreakdownItem;
  recommended?: number;
  consumed?: number;
  unit: string;
}

export function EnhancedNutritionProgressBar({ 
  item, 
  recommended, 
  consumed, 
  unit 
}: EnhancedNutritionProgressBarProps) {
  const currentValue = typeof item.value === 'number' ? item.value : parseFloat(item.value.toString()) || 0;
  const recommendedValue = recommended || 0;
  const consumedValue = consumed || 0;
  const totalConsumed = consumedValue + currentValue;

  // Calculate percentages based on recommended value
  const consumedPercent = recommendedValue > 0 ? Math.min((consumedValue / recommendedValue) * 100, 100) : 0;
  const currentPercent = recommendedValue > 0 ? Math.min((currentValue / recommendedValue) * 100, 100) : 0;
  const totalPercent = recommendedValue > 0 ? Math.min((totalConsumed / recommendedValue) * 100, 100) : 0;

  // Determine status color based on total consumed vs recommended
  const getStatusColor = () => {
    if (totalPercent <= 70) return 'bg-green-500';
    if (totalPercent <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={`flex flex-col py-4 border-b border-gray-100 last:border-0 ${item.isGrayed ? 'opacity-40' : ''}`}
      data-testid={`row-breakdown-${item.name.toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#00453A',
            width: '80px',
          }}
        >
          {item.name}
        </span>

        {item.isLocked ? (
          <div className="flex-1 flex items-center justify-center gap-2">
            <Lock size={16} color="#00856F" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#00856F',
              }}
            >
              Subscribe to Premium to access more sections
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-1 justify-end">
            {recommended !== undefined && (
              <div className="flex flex-col items-end">
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  Recommended
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#00453A',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  {recommended.toFixed(1)}{unit}
                </span>
              </div>
            )}
            {consumed !== undefined && (
              <div className="flex flex-col items-end">
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: '#546E7A',
                  }}
                >
                  Consumed
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#00453A',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  {consumedValue.toFixed(1)}{unit}
                </span>
              </div>
            )}
            <div className="flex flex-col items-end">
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: '#546E7A',
                }}
              >
                This Scan
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#00453A',
                  minWidth: '50px',
                  textAlign: 'right',
                }}
              >
                {currentValue.toFixed(1)}{unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {!item.isLocked && recommended !== undefined && (
        <div className="flex-1 relative h-8 mx-0 overflow-hidden rounded-full bg-gray-100">
          {/* Background track with three zones */}
          <div className="absolute inset-0 flex rounded-full">
            <div className="flex-1 bg-green-200" />
            <div className="flex-1 bg-yellow-200" />
            <div className="flex-1 bg-red-200" />
          </div>
          
          {/* Consumed nutrients bar (darker) */}
          {consumedValue > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gray-600"
              style={{
                left: '0%',
                width: `${Math.min(consumedPercent, 100)}%`,
                zIndex: 1,
                borderRadius: currentValue > 0 && consumedPercent < 100 ? '4px 0 0 4px' : '4px',
              }}
            />
          )}
          
          {/* Current scan nutrients bar (lighter, on top) */}
          {currentValue > 0 && (
            <div
              className={`absolute top-0 bottom-0 ${getStatusColor()}`}
              style={{
                left: `${Math.min(consumedPercent, 100)}%`,
                width: `${Math.min(currentPercent, Math.max(0, 100 - consumedPercent))}%`,
                zIndex: 2,
                borderRadius: consumedValue > 0 ? '0 4px 4px 0' : '4px',
              }}
            />
          )}
          
          {/* Recommended indicator line (at 100% of recommended value) */}
          {recommendedValue > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-black opacity-50"
              style={{
                left: '100%',
                transform: 'translateX(-50%)',
                zIndex: 3,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

