import { SlotCard } from './SlotCard';
import type { Slot } from '@/services/bookingService';

interface OnlineSlotsSectionProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSlotSelect: (slot: Slot) => void;
}

export function OnlineSlotsSection({ slots, selectedSlotId, onSlotSelect }: OnlineSlotsSectionProps) {
  if (slots.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-md font-semibold mb-3" style={{ color: '#00453A' }}>
        Online Consultations
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            isSelected={selectedSlotId === slot.id}
            onClick={() => onSlotSelect(slot)}
          />
        ))}
      </div>
    </div>
  );
}

