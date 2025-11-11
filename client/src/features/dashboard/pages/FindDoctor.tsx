import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoctorCard } from '../components/DoctorCard';
import { ConfirmationScreen } from '../components/ConfirmationScreen';
import { useSpecialties, useAllPhysicians, usePhysiciansBySpecialty } from '@/hooks/mutations/usePhysician';
import { useDatesWithAvailability, useAvailableSlotsForDate, useBookSlot } from '@/hooks/mutations/useBooking';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import type { Physician } from '@/services/physicianService';
import type { Slot, PhysicianLocation } from '@/services/bookingService';
import { calculateDistance, getCurrentLocation } from '@/utils/distance';
import { useToast } from '@/hooks/use-toast';

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

function mapPhysicianToDoctor(physician: any) {
  const practiceStartDate = physician.practiceStartDate || new Date();
  const yearsOfExperience = Math.max(1, new Date().getFullYear() - new Date(practiceStartDate).getFullYear());
  return {
    id: physician.id,
    name: physician.firstName + ' ' + physician.lastName || 'Dr. Unknown',
    specialty: physician.specialty || '',
    experience: `${yearsOfExperience}+ years`,
    rating: physician.rating || 0,
    isOnline: physician.isOnline || false,
    image: physician.imageUrl || '',
    consultationFee: physician.consultationFee,
  };
}

export function FindDoctor() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedSlotType, setSelectedSlotType] = useState<{ id: string; type: string; price: string } | null>(null);
  const [isConsultationTypeDialogOpen, setIsConsultationTypeDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDistances, setLocationDistances] = useState<Record<string, number>>({});

  const { data: specialties = [] } = useSpecialties();
  const { data: allPhysicians = [] } = useAllPhysicians();
  const { data: physiciansBySpecialty = [] } = usePhysiciansBySpecialty(selectedSpecialtyId);

  const physicians = selectedSpecialtyId === null ? allPhysicians : physiciansBySpecialty;
  const { data: datesWithAvailability = [] } = useDatesWithAvailability(
    selectedPhysician?.id || null
  );
  const { data: availableSlots = [] } = useAvailableSlotsForDate(
    selectedPhysician?.id || null,
    selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null
  );

  const bookSlotMutation = useBookSlot();

  // Get user's current location
  useEffect(() => {
    getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
      })
      .catch((error) => {
        console.warn('Could not get user location:', error);
      });
  }, []);

  // Calculate distances when slots or user location changes
  useEffect(() => {
    if (!userLocation || !availableSlots.length) {
      return;
    }

    const distances: Record<string, number> = {};
    availableSlots.forEach((slot) => {
      if (slot.locations && slot.locations.length > 0) {
        slot.locations.forEach((location) => {
          const lat = parseFloat(location.latitude);
          const lng = parseFloat(location.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            distances[location.id] = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              lat,
              lng
            );
          }
        });
      }
    });
    setLocationDistances(distances);
  }, [availableSlots, userLocation?.lat, userLocation?.lng]);

  const availableDates = datesWithAvailability.map((d) => {
    if (typeof d === 'string') {
      return new Date(d);
    }
    return new Date(d);
  });

  const filteredPhysicians = physicians.filter((physician) => {
    const matchesSearch =
      searchQuery === '' ||
      (physician.firstName + ' ' + physician.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (physician.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleConsultClick = (physician: Physician) => {
    setSelectedPhysician(physician);
    setCurrentStep(2);
  };

  const handleBackToList = () => {
    setCurrentStep(1);
    setSelectedPhysician(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      return;
    }

    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedLocationId(null); // Reset location filter when date changes
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    // If slot has multiple types, show dialog to choose
    if (slot.prices && slot.prices.length > 1) {
      setIsConsultationTypeDialogOpen(true);
    } else if (slot.prices && slot.prices.length === 1) {
      // Only one type, auto-select it
      setSelectedSlotType({
        id: slot.prices[0].slotTypeId,
        type: slot.prices[0].slotType?.type || 'online',
        price: slot.prices[0].price,
      });
      setIsConsultationTypeDialogOpen(true);
    }
  };

  const handleConfirmConsultationType = async () => {
    if (!selectedSlot || !selectedSlotType) return;

    try {
      await bookSlotMutation.mutateAsync({ slotId: selectedSlot.id });
      setIsConsultationTypeDialogOpen(false);
      setCurrentStep(3);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleProceedToConfirmation = () => {
    if (selectedDate && selectedSlot) {
      setCurrentStep(3);
    }
  };

  const handleBackToBooking = () => {
    setCurrentStep(2);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-4 sm:pt-8 pb-4 sm:pb-8">
        {currentStep === 1 ? (
          <div className="w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                  data-testid="icon-search"
                />
                <Input
                  type="text"
                  placeholder="Search by name or specialty"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-200"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#00453A',
                  }}
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Specialty Filter Tabs */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2" data-testid="section-specialty-tabs">
              <button
                onClick={() => setSelectedSpecialtyId(null)}
                className={cn(
                  'px-4 sm:px-6 py-2 rounded-full whitespace-nowrap transition-all',
                  selectedSpecialtyId === null ? 'shadow-sm' : ''
                )}
                style={{
                  background: selectedSpecialtyId === null ? '#E0F2F1' : '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  fontWeight: selectedSpecialtyId === null ? 600 : 500,
                  color: '#00453A',
                }}
              >
                All Doctors
              </button>
              {specialties.map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => setSelectedSpecialtyId(specialty.id)}
                  className={cn(
                    'px-4 sm:px-6 py-2 rounded-full whitespace-nowrap transition-all',
                    selectedSpecialtyId === specialty.id ? 'shadow-sm' : ''
                  )}
                  style={{
                    background: selectedSpecialtyId === specialty.id ? '#E0F2F1' : '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: selectedSpecialtyId === specialty.id ? 600 : 500,
                    color: '#00453A',
                  }}
                  data-testid={`tab-specialty-${specialty.id}`}
                >
                  {specialty.name}
                </button>
              ))}
            </div>

            {/* Doctors Grid */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              data-testid="section-doctors-grid"
            >
              {filteredPhysicians.length > 0 ? (
                filteredPhysicians.map((physician) => (
                  <DoctorCard
                    key={physician.id}
                    doctor={mapPhysicianToDoctor(physician)}
                    onConsultClick={() => handleConsultClick(physician)}
                    variant="compact"
                  />
                ))
              ) : (
                <div
                  className="col-span-full text-center py-12"
                  data-testid="text-no-results"
                >
                  <p style={{ fontSize: '16px', color: '#546E7A' }}>
                    No doctors found matching your search criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : currentStep === 2 ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
            {selectedPhysician && (
              <div className="w-full max-w-[800px]">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                  <button
                    onClick={handleBackToList}
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
                <Card
                  className="p-4 sm:p-6 mb-4 sm:mb-6"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    modifiers={{
                      hasAvailability: availableDates,
                    }}
                    modifiersClassNames={{
                      hasAvailability: 'bg-teal-100 text-teal-900 font-semibold',
                    }}
                  />
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                    <div className="w-4 h-4 bg-teal-100 rounded"></div>
                    <span>Dates with available slots</span>
                  </div>
                </Card>

                {/* Available Slots */}
                {selectedDate && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#00453A' }}>
                      Available Slots for {formatDate(selectedDate, 'MMM dd, yyyy')}
                    </h3>

                    {/* Location Filter */}
                    {(() => {
                      // Get all unique locations from available slots
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

                      return allLocations.length > 0 ? (
                        <div className="mb-4">
                          <Label className="text-sm font-medium mb-2 block">Filter by Location</Label>
                          <Select value={selectedLocationId || 'all'} onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : value)}>
                            <SelectTrigger className="w-full sm:w-64">
                              <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {allLocations.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.locationName}
                                  {locationDistances[location.id] !== undefined && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({locationDistances[location.id]} km away)
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null;
                    })()}

                    {(() => {
                      // Separate slots by type
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

                      if (filteredSlots.length === 0) {
                        return (
                          <p className="text-gray-500 text-center py-8">
                            {selectedLocationId
                              ? 'No available slots for the selected location'
                              : 'No available slots for this date'}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          {/* Online Only Slots */}
                          {onlineOnlySlots.length > 0 && (
                            <div>
                              <h4 className="text-md font-semibold mb-3" style={{ color: '#00453A' }}>
                                Online Consultations
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {onlineOnlySlots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => handleSlotSelect(slot)}
                                    className={cn(
                                      'p-4 rounded-lg border transition-all text-left',
                                      selectedSlot?.id === slot.id
                                        ? 'border-[#00856F] bg-[#E0F2F1]'
                                        : 'border-gray-200 bg-white hover:bg-[#F7F9F9]'
                                    )}
                                  >
                                    <div className="font-medium text-sm mb-2" style={{ color: '#00453A' }}>
                                      {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                                    </div>
                                    <div className="space-y-1">
                                      {slot.prices
                                        ?.filter((price) => price.slotType?.type.toLowerCase() === 'online')
                                        .map((price) => (
                                          <div key={price.id} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600 capitalize">{price.slotType?.type}:</span>
                                            <span className="font-semibold" style={{ color: '#00856F' }}>
                                              PKR {parseFloat(price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Offline/Onsite Slots grouped by location */}
                          {offlineSlots.length > 0 && (
                            <div>
                              <h4 className="text-md font-semibold mb-3" style={{ color: '#00453A' }}>
                                In-Person Consultations
                              </h4>
                              {(() => {
                                // Group slots by location
                                const slotsByLocation = new Map<string, { location: PhysicianLocation; slots: Slot[] }>();
                                offlineSlots.forEach((slot) => {
                                  if (slot.locations) {
                                    slot.locations.forEach((location) => {
                                      if (!slotsByLocation.has(location.id)) {
                                        slotsByLocation.set(location.id, { location, slots: [] });
                                      }
                                      slotsByLocation.get(location.id)!.slots.push(slot);
                                    });
                                  }
                                });

                                return Array.from(slotsByLocation.values()).map(({ location, slots: locationSlots }) => (
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
                                        <button
                                          key={slot.id}
                                          onClick={() => handleSlotSelect(slot)}
                                          className={cn(
                                            'p-4 rounded-lg border transition-all text-left',
                                            selectedSlot?.id === slot.id
                                              ? 'border-[#00856F] bg-[#E0F2F1]'
                                              : 'border-gray-200 bg-white hover:bg-[#F7F9F9]'
                                          )}
                                        >
                                          <div className="font-medium text-sm mb-2" style={{ color: '#00453A' }}>
                                            {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                                          </div>
                                          <div className="space-y-1">
                                            {slot.prices
                                              ?.filter(
                                                (price) =>
                                                  price.slotType?.type.toLowerCase() === 'onsite' ||
                                                  price.slotType?.type.toLowerCase() === 'offline'
                                              )
                                              .map((price) => (
                                                <div key={price.id} className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-600 capitalize">{price.slotType?.type}:</span>
                                                  <span className="font-semibold" style={{ color: '#00856F' }}>
                                                    PKR {parseFloat(price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                              ))}
                                            {/* Also show online price if available */}
                                            {slot.prices
                                              ?.filter((price) => price.slotType?.type.toLowerCase() === 'online')
                                              .map((price) => (
                                                <div key={price.id} className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-600 capitalize">{price.slotType?.type}:</span>
                                                  <span className="font-semibold" style={{ color: '#00856F' }}>
                                                    PKR {parseFloat(price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                              ))}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Consultation Type Selection Dialog */}
            <Dialog open={isConsultationTypeDialogOpen} onOpenChange={setIsConsultationTypeDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Select Consultation Type</DialogTitle>
                  <DialogDescription>
                    Choose your preferred consultation type for this slot
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 p-4 ">
                  {selectedSlot?.prices?.map((price: any) => (
                    <button
                      key={price.id}
                      onClick={() => setSelectedSlotType({
                        id: price.slotTypeId,
                        type: price.slotType?.type || 'online',
                        price: price.price,
                      })}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        selectedSlotType?.id === price.slotTypeId
                          ? 'border-[#00856F] bg-[#E0F2F1]'
                          : 'border-gray-200 bg-white hover:border-[#00856F] hover:bg-[#F7F9F9]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize" style={{ color: '#00453A' }}>
                            {price.slotType?.type} Consultation
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {selectedSlot?.startTime?.substring(0, 5)} - {selectedSlot?.endTime?.substring(0, 5)}
                          </div>
                        </div>
                        <div className="text-lg font-semibold" style={{ color: '#00856F' }}>
                          PKR {parseFloat(price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 p-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsConsultationTypeDialogOpen(false);
                      setSelectedSlot(null);
                      setSelectedSlotType(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmConsultationType}
                    disabled={!selectedSlotType}
                    className="flex-1"
                    style={{
                      background: selectedSlotType ? '#00856F' : '#B0BEC5',
                      color: '#FFFFFF',
                    }}
                  >
                    Book Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
            {selectedPhysician && selectedDate && selectedSlot && (
              <ConfirmationScreen
                doctor={mapPhysicianToDoctor(selectedPhysician)}
                date={selectedDate}
                time={`${selectedSlot.startTime.substring(0, 5)} - ${selectedSlot.endTime.substring(0, 5)}`}
                hospital={{ id: '1', name: selectedSlotType?.type || 'Online' }}
                onBack={handleBackToBooking}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
