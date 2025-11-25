import { MapPin } from 'lucide-react';
import { SlotCard } from './SlotCard';
import type { Slot, PhysicianLocation } from '@/services/bookingService';

interface OfflineSlotsSectionProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSlotSelect: (slot: Slot) => void;
  locationDistances: Record<string, number>;
}

export function OfflineSlotsSection({
  slots,
  selectedSlotId,
  onSlotSelect,
  locationDistances,
}: OfflineSlotsSectionProps) {
  if (slots.length === 0) {
    return null;
  }

  // Group slots by location
  const slotsByLocation = new Map<string, { location: PhysicianLocation; slots: Slot[] }>();
  slots.forEach((slot) => {
    if (slot.locations) {
      slot.locations.forEach((location) => {
        if (!slotsByLocation.has(location.id)) {
          slotsByLocation.set(location.id, { location, slots: [] });
        }
        slotsByLocation.get(location.id)!.slots.push(slot);
      });
    }
  });

  return (
    <div>
      <h4 className="text-md font-semibold mb-3" style={{ color: '#00453A' }}>
        In-Person Consultations
      </h4>
      {Array.from(slotsByLocation.values()).map(({ location, slots: locationSlots }) => (
        <div key={location.id} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" style={{ color: '#00856F' }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: '#00453A' }}>
                {location.locationName}
              </div>
              {location.address && (
                <div className="text-xs text-gray-600">{location.address}</div>
              )}
              {locationDistances[location.id] !== undefined && (
                <div className="text-xs font-medium" style={{ color: '#00856F' }}>
                  {locationDistances[location.id]} km away
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locationSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onClick={() => onSlotSelect(slot)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

