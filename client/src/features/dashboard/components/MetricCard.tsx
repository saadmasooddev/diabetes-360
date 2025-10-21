import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

export function MetricCard({ title, value, unit, icon: Icon, color, onClick }: MetricCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
      data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground" data-testid={`text-metric-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold" data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value ?? '--'}
              </h3>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
