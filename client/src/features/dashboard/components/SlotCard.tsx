import { cn, formatTime12 } from '@/lib/utils';
import type { Slot } from '@/services/bookingService';

interface SlotCardProps {
  slot: Slot;
  isSelected: boolean;
  onClick: () => void;
}

export function SlotCard({ slot, isSelected, onClick }: SlotCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border transition-all text-left',
        isSelected
          ? 'border-[#00856F] bg-[#E0F2F1]'
          : 'border-gray-200 bg-white hover:bg-[#F7F9F9]'
      )}
    >
      <div className="font-medium text-sm" style={{ color: '#00453A' }}>
        {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
      </div>
    </button>
  );
}

