import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ConcernCard } from '../components/ConcernCard';
import { DoctorCard } from '../components/DoctorCard';
import { PaymentScreen } from '../components/PaymentScreen';
import { useSpecialties, usePhysiciansBySpecialty } from '@/hooks/mutations/usePhysician';
import type { Physician } from '@/services/physicianService';
import type { Doctor } from '@/mocks/doctors';
import doctorImage from '@assets/stock_images/professional_female__7f02b2b3.jpg';

type ConsultationStep = 'concern' | 'doctors' | 'payment';

// Map physician to Doctor type for compatibility
function mapPhysicianToDoctor(physician: Physician): Doctor {
  return {
    id: physician.id,
    name: physician.firstName + ' ' + physician.lastName || 'Dr. Unknown',
    specialty: physician.specialty,
    experience: physician.experience,
    rating: physician.rating || 0,
    isOnline: true, // Default to online for now
    image: physician.imageUrl || physician.avatar || doctorImage,
    consultationFee: parseFloat(physician.consultationFee) || 0,
  };
}

export function InstantConsultation() {
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('concern');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const { data: specialties = [], isLoading: isLoadingSpecialties } = useSpecialties();
  const { data: physicians = [], isLoading: isLoadingPhysicians } = usePhysiciansBySpecialty(selectedSpecialtyId);

  const selectedSpecialtyName = specialties.find(s => s.id === selectedSpecialtyId)?.name || '';

  // Map specialties to concerns format for ConcernCard
  const concerns = specialties.map(specialty => ({
    id: specialty.id,
    name: specialty.name,
    specialty: specialty.name,
    icon: specialty.icon || 'stethoscope',
  }));

  // Map physicians to doctors format
  const doctors = physicians.map(mapPhysicianToDoctor);

  const handleConcernSelect = (specialtyId: string) => {
    setSelectedSpecialtyId(specialtyId);
  };

  const handleConsultNow = () => {
    if (selectedSpecialtyId) {
      setCurrentStep('doctors');
    }
  };

  const handleDoctorConsult = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('payment');
  };

  const handleBackFromDoctors = () => {
    setCurrentStep('concern');
    setSelectedSpecialtyId(null);
  };

  const handleBackFromPayment = () => {
    setCurrentStep('doctors');
    setSelectedDoctor(null);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-8 pb-8">
        <div className="w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
          {currentStep === 'concern' && (
            <div data-testid="section-concern-selection" className="flex flex-col min-h-[calc(100vh-4rem)]">
              <div className="flex items-center gap-4 mb-8">
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 600,
                    color: '#00453A',
                  }}
                  data-testid="text-title"
                >
                  Select your Concern
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 flex-1">
                {isLoadingSpecialties ? (
                  <div className="col-span-full text-center py-12">
                    <p style={{ fontSize: '16px', color: '#546E7A' }}>Loading specialties...</p>
                  </div>
                ) : concerns.length > 0 ? (
                  concerns.map((concern) => (
                    <ConcernCard
                      key={concern.id}
                      concern={concern}
                      isSelected={selectedSpecialtyId === concern.id}
                      onClick={() => handleConcernSelect(concern.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p style={{ fontSize: '16px', color: '#546E7A' }}>No specialties available.</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-8">
                <Button
                  onClick={handleConsultNow}
                  disabled={!selectedSpecialtyId}
                  className="w-full"
                  style={{
                    background: selectedSpecialtyId ? '#00856F' : '#B0BEC5',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    height: 'auto',
                    cursor: selectedSpecialtyId ? 'pointer' : 'not-allowed',
                    opacity: selectedSpecialtyId ? 1 : 0.6,
                  }}
                  data-testid="button-consult-now"
                >
                  Consult Now
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'doctors' && (
            <div data-testid="section-doctors-list">
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={handleBackFromDoctors}
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  data-testid="button-back"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <ArrowLeft size={24} color="#00453A" />
                </button>
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 600,
                    color: '#00453A',
                  }}
                  data-testid="text-selected-concern"
                >
                  {selectedSpecialtyName}
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoadingPhysicians ? (
                  <div className="col-span-full text-center py-12">
                    <p style={{ fontSize: '16px', color: '#546E7A' }}>Loading physicians...</p>
                  </div>
                ) : doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onConsultClick={handleDoctorConsult}
                    />
                  ))
                ) : (
                  <div
                    className="col-span-full text-center py-12"
                    data-testid="text-no-doctors"
                  >
                    <p style={{ fontSize: '16px', color: '#546E7A' }}>
                      No doctors available for this specialty at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'payment' && selectedDoctor && (
            <PaymentScreen
              doctor={selectedDoctor}
              onBack={handleBackFromPayment}
            />
          )}
        </div>
      </main>
    </div>
  );
}
