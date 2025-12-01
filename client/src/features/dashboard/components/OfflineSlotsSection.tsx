import { MapPin, Navigation, Building2, Sun, Sunset, Moon } from 'lucide-react';
import { SlotCard } from './SlotCard';
import type { Slot, PhysicianLocation } from '@/services/bookingService';
import { groupSlotsByPeriod } from '@/lib/utils';
import { getPeriodIcon } from './BookingStep';

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

  const sortedLocations = Array.from(slotsByLocation.values()).sort((a, b) => {
    const distA = locationDistances[a.location.id];
    const distB = locationDistances[b.location.id];

    if (distA !== undefined && distB !== undefined) {
      return distA - distB;
    }
    if (distA !== undefined) return -1;
    if (distB !== undefined) return 1;
    return a.location.locationName.localeCompare(b.location.locationName);
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-50">
          <Building2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold" style={{ color: '#00453A' }}>
            In-Person Consultations
          </h4>
          <p className="text-sm text-gray-600">
            {slots.length} {slots.length === 1 ? 'slot' : 'slots'} across {sortedLocations.length} {sortedLocations.length === 1 ? 'location' : 'locations'}
          </p>
        </div>
      </div>

      {/* Location Cards */}
      {sortedLocations.map(({ location, slots: locationSlots }) => {
        const distance = locationDistances[location.id];
        const slotsByPeriod = groupSlotsByPeriod(locationSlots);
        const periodOrder = ['Morning', 'Afternoon', 'Evening', 'Night'];

        return (
          <div
            key={crypto.randomUUID()}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Location Header */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="p-2 rounded-lg bg-[#E0F2F1] flex-shrink-0">
                <MapPin className="h-5 w-5" style={{ color: '#00856F' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-base mb-1" style={{ color: '#00453A' }}>
                      {location.locationName}
                    </h5>
                    {location.address && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {location.address}
                      </p>
                    )}
                  </div>
                  {distance !== undefined && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 flex-shrink-0">
                      <Navigation className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        {distance.toFixed(1)} km
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium mt-2" style={{ color: '#00856F' }}>
                  {locationSlots.length} {locationSlots.length === 1 ? 'slot' : 'slots'} available
                </div>
              </div>
            </div>

            {/* Slots Grouped by Time Period */}
            <div className="space-y-4">
              {periodOrder.map((period) => {
                const periodSlots = slotsByPeriod.get(period);
                if (!periodSlots || periodSlots.length === 0) return null;

                return (
                  <div key={period} className="space-y-2.5">
                    {/* Period Header */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        {getPeriodIcon(period)}
                        <span>{period}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                      <span className="text-xs text-gray-500">{periodSlots.length} {periodSlots.length === 1 ? 'slot' : 'slots'}</span>
                    </div>

                    {/* Slots Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                      {periodSlots.map((slot) => (
                        <SlotCard
                          defaultDisplay='offline'
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlotId === slot.id}
                          onClick={() => onSlotSelect(slot)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

