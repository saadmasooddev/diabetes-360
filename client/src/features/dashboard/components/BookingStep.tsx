import { ArrowLeft } from 'lucide-react';
import { BookingCalendar } from './BookingCalendar';
import { LocationFilter } from './LocationFilter';
import { OnlineSlotsSection } from './OnlineSlotsSection';
import { OfflineSlotsSection } from './OfflineSlotsSection';
import { SlotCardSkeleton } from '@/components/ui/skeletons';
import type { Physician } from '@/services/physicianService';
import type { Slot, PhysicianLocation } from '@/services/bookingService';

const formatDate = (date: Date, formatStr: string): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (formatStr === 'MMM dd, yyyy') {
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return date.toLocaleDateString();
};

interface BookingStepProps {
  selectedPhysician: Physician;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  availableDates: Date[];
  isLoadingDates: boolean;
  availableSlots: Slot[];
  isLoadingSlots: boolean;
  selectedSlot: Slot | null;
  onSlotSelect: (slot: Slot) => void;
  selectedLocationId: string | null;
  onLocationChange: (locationId: string | null) => void;
  locationDistances: Record<string, number>;
  onBack: () => void;
}

export function BookingStep({
  selectedPhysician,
  selectedDate,
  onDateSelect,
  calendarMonth,
  onMonthChange,
  availableDates,
  isLoadingDates,
  availableSlots,
  isLoadingSlots,
  selectedSlot,
  onSlotSelect,
  selectedLocationId,
  onLocationChange,
  locationDistances,
  onBack,
}: BookingStepProps) {
  // Get all unique locations from available slots
  const getAllLocations = (): PhysicianLocation[] => {
    const allLocations: PhysicianLocation[] = [];
    const locationMap = new Map<string, PhysicianLocation>();
    availableSlots
      .filter((slot) => !slot.isBooked)
      .forEach((slot) => {
        if (slot.locations) {
          slot.locations.forEach((loc) => {
            if (!locationMap.has(loc.id)) {
              locationMap.set(loc.id, loc);
              allLocations.push(loc);
            }
          });
        }
      });
    return allLocations;
  };

  // Separate and filter slots
  const getFilteredSlots = () => {
    const unbookedSlots = availableSlots.filter((slot) => !slot.isBooked);

    // Filter by location if selected
    const filteredSlots = selectedLocationId
      ? unbookedSlots.filter((slot) =>
        slot.locations?.some((loc) => loc.id === selectedLocationId)
      )
      : unbookedSlots;

    // Separate online-only vs slots with offline/onsite
    const onlineOnlySlots = filteredSlots.filter((slot) => {
      const hasOnline = slot.types?.some((t) => t.type.toLowerCase() === 'online');
      const hasOffline = slot.types?.some(
        (t) => t.type.toLowerCase() === 'onsite' || t.type.toLowerCase() === 'offline'
      );
      return hasOnline && !hasOffline;
    });

    const offlineSlots = filteredSlots.filter((slot) => {
      const hasOffline = slot.types?.some(
        (t) => t.type.toLowerCase() === 'onsite' || t.type.toLowerCase() === 'offline'
      );
      return hasOffline;
    });

    return { onlineOnlySlots, offlineSlots, filteredSlots };
  };

  const { onlineOnlySlots, offlineSlots, filteredSlots } = getFilteredSlots();
  const allLocations = getAllLocations();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-[800px]">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E0F2F1] transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={24} color="#00856F" />
          </button>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#00856F',
            }}
            className="sm:text-2xl"
          >
            Book a Consultation
          </h1>
        </div>

        {/* Doctor Information */}
        <div className="mb-6 sm:mb-8">
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#00453A',
            }}
          >
            {selectedPhysician.firstName + ' ' + selectedPhysician.lastName}
          </h2>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#00856F',
            }}
          >
            {selectedPhysician.specialty}
          </p>
        </div>

        {/* Calendar */}
        <BookingCalendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          calendarMonth={calendarMonth}
          onMonthChange={onMonthChange}
          availableDates={availableDates}
          isLoading={isLoadingDates}
        />

        {/* Available Slots */}
        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#00453A' }}>
              Available Slots for {formatDate(selectedDate, 'MMM dd, yyyy')}
            </h3>
            {isLoadingSlots && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SlotCardSkeleton key={index} />
                ))}
              </div>
            )}
            {!isLoadingSlots && (
              <>
                <LocationFilter
                  locations={allLocations}
                  selectedLocationId={selectedLocationId}
                  onLocationChange={onLocationChange}
                  locationDistances={locationDistances}
                />

                {filteredSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {selectedLocationId
                      ? 'No available slots for the selected location'
                      : 'No available slots for this date'}
                  </p>
                ) : (
                  <div className="space-y-6">
                    <OnlineSlotsSection
                      slots={onlineOnlySlots}
                      selectedSlotId={selectedSlot?.id || null}
                      onSlotSelect={onSlotSelect}
                    />
                    <OfflineSlotsSection
                      slots={offlineSlots}
                      selectedSlotId={selectedSlot?.id || null}
                      onSlotSelect={onSlotSelect}
                      locationDistances={locationDistances}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

