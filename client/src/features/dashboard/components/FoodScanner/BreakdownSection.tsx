import { Card } from '@/components/ui/card';
import { NutritionProgressBar } from '../NutritionProgressBar';
import type { ScanResult } from '@/mocks/scanResults';

interface BreakdownSectionProps {
  scanResult: ScanResult | null;
}

export function BreakdownSection({ scanResult }: BreakdownSectionProps) {
  return (
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
    </Card>
  );
}

