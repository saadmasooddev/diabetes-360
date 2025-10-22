import { Lock } from 'lucide-react';
import type { BreakdownItem } from '@/mocks/scanResults';

interface NutritionProgressBarProps {
  item: BreakdownItem;
}

export function NutritionProgressBar({ item }: NutritionProgressBarProps) {
  return (
    <div
      className={`flex items-center justify-between py-4 border-b border-gray-100 last:border-0 ${
        item.isGrayed ? 'opacity-40' : ''
      }`}
      data-testid={`row-breakdown-${item.name.toLowerCase()}`}
    >
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
        <>
          <div className="flex-1 relative h-6 mx-4">
            {/* Background track with three zones */}
            <div className="absolute inset-0 flex rounded-full overflow-hidden">
              <div className="flex-1 bg-green-200" />
              <div className="flex-1 bg-yellow-200" />
              <div className="flex-1 bg-red-200" />
            </div>
            {/* Position indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-black rounded-full"
              style={{ left: `${item.position}%` }}
            />
          </div>
          <div className="flex items-center gap-4">
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#00453A',
                minWidth: '50px',
                textAlign: 'right',
              }}
            >
              {item.value}{item.unit}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
