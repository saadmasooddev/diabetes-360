import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { mockDoctors, type Doctor } from '@/mocks/doctors';
import { type Hospital } from '@/mocks/hospitals';
import { cn } from '@/lib/utils';
import { DoctorCard } from '../components/DoctorCard';
import { BookingScreen } from '../components/BookingScreen';
import { ConfirmationScreen } from '../components/ConfirmationScreen';

type SpecialtyFilter = 'All' | 'Diabetologist' | 'Nutritionist' | 'Health Coach';

const specialtyTabs: SpecialtyFilter[] = ['All', 'Diabetologist', 'Nutritionist', 'Health Coach'];

export function FindDoctor() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDetails, setBookingDetails] = useState<{
    date: Date;
    time: string;
    hospital: Hospital;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyFilter>('All');

  const filteredDoctors = mockDoctors.filter((doctor) => {
    const matchesSearch =
      searchQuery === '' ||
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'All' || doctor.specialty.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const handleConsultClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep(2);
  };

  const handleBackToList = () => {
    setCurrentStep(1);
    setSelectedDoctor(null);
  };

  const handleProceedToConfirmation = (date: Date, time: string, hospital: Hospital) => {
    setBookingDetails({ date, time, hospital });
    setCurrentStep(3);
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
              {specialtyTabs.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={cn(
                    'px-4 sm:px-6 py-2 rounded-full whitespace-nowrap transition-all',
                    selectedSpecialty === specialty
                      ? 'shadow-sm'
                      : ''
                  )}
                  style={{
                    background: selectedSpecialty === specialty ? '#E0F2F1' : '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: selectedSpecialty === specialty ? 600 : 500,
                    color: '#00453A',
                  }}
                  data-testid={`tab-specialty-${specialty.toLowerCase().replace(' ', '-')}`}
                >
                  {specialty === 'All' ? 'All Doctors' : `${specialty}s`}
                </button>
              ))}
            </div>

            {/* Doctors Grid */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              data-testid="section-doctors-grid"
            >
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    onConsultClick={handleConsultClick}
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
            {selectedDoctor && (
              <BookingScreen 
                doctor={selectedDoctor} 
                onBack={handleBackToList}
                onProceed={handleProceedToConfirmation}
              />
            )}
          </div>
        ) : (
          <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
            {selectedDoctor && bookingDetails && (
              <ConfirmationScreen
                doctor={selectedDoctor}
                date={bookingDetails.date}
                time={bookingDetails.time}
                hospital={bookingDetails.hospital}
                onBack={handleBackToBooking}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
