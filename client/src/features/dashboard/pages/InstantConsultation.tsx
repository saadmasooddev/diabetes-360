import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowLeft, Stethoscope, Apple, Heart, Activity } from 'lucide-react';
import { mockDoctors, type Doctor } from '@/mocks/doctors';
import { mockConcerns, type Concern } from '@/mocks/concerns';

const concernIcons = {
  stethoscope: Stethoscope,
  apple: Apple,
  'heart-pulse': Heart,
  activity: Activity,
};

function ConcernCard({ 
  concern, 
  isSelected, 
  onClick 
}: { 
  concern: Concern; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const IconComponent = concernIcons[concern.icon as keyof typeof concernIcons] || Stethoscope;
  
  return (
    <Card
      className="p-6 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
      style={{
        background: isSelected ? '#E0F2F1' : '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
      onClick={onClick}
      data-testid={`card-concern-${concern.id}`}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: '48px',
          height: '48px',
          background: '#00856F',
        }}
      >
        <IconComponent size={24} color="#FFFFFF" />
      </div>
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#00453A',
        }}
        data-testid={`text-concern-${concern.id}`}
      >
        {concern.name}
      </h3>
    </Card>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <Card
      className="p-6 flex flex-col sm:flex-row gap-6"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
      data-testid={`card-doctor-${doctor.id}`}
    >
      <div className="relative flex-shrink-0">
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto sm:mx-0">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-full h-full rounded-full object-cover"
            style={{
              border: '4px solid #E0F2F1',
            }}
            data-testid={`img-doctor-${doctor.id}`}
          />
          <div
            className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{
              background: '#FFFFFF',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
            data-testid={`status-${doctor.isOnline ? 'online' : 'offline'}-${doctor.id}`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: doctor.isOnline ? '#00856F' : '#EF5350',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#00453A',
              }}
            >
              {doctor.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3
            className="mb-1"
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid={`text-doctor-name-${doctor.id}`}
          >
            {doctor.name}
          </h3>
          <p
            className="mb-4"
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#00856F',
            }}
            data-testid={`text-specialty-${doctor.id}`}
          >
            {doctor.specialty}
          </p>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#00856F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Experience
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#546E7A',
                }}
                data-testid={`text-experience-${doctor.id}`}
              >
                {doctor.experience}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#00856F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Ratings
              </span>
              <div className="flex items-center gap-1" data-testid={`rating-${doctor.id}`}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < doctor.rating ? '#00856F' : 'none'}
                    stroke={i < doctor.rating ? '#00856F' : '#B0BEC5'}
                    data-testid={`star-${i + 1}-${doctor.id}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button
          className="w-full sm:w-auto"
          style={{
            background: '#00856F',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            padding: '12px 32px',
            borderRadius: '8px',
            height: 'auto',
          }}
          data-testid={`button-consult-${doctor.id}`}
        >
          Consult Now
        </Button>
      </div>
    </Card>
  );
}

export function InstantConsultation() {
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [showDoctors, setShowDoctors] = useState(false);

  const filteredDoctors = selectedConcern
    ? mockDoctors.filter((doctor) => doctor.specialty === selectedConcern)
    : [];

  const handleConcernSelect = (concernSpecialty: string) => {
    setSelectedConcern(concernSpecialty);
  };

  const handleConsultNow = () => {
    if (selectedConcern) {
      setShowDoctors(true);
    }
  };

  const handleBack = () => {
    setShowDoctors(false);
    setSelectedConcern(null);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-8 pb-8">
        <div className="w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
          {!showDoctors ? (
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
                {mockConcerns.map((concern) => (
                  <ConcernCard
                    key={concern.id}
                    concern={concern}
                    isSelected={selectedConcern === concern.specialty}
                    onClick={() => handleConcernSelect(concern.specialty)}
                  />
                ))}
              </div>

              {/* Consult Now Button at the bottom */}
              <div className="mt-auto pt-8">
                <Button
                  onClick={handleConsultNow}
                  disabled={!selectedConcern}
                  className="w-full"
                  style={{
                    background: selectedConcern ? '#00856F' : '#B0BEC5',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    height: 'auto',
                    cursor: selectedConcern ? 'pointer' : 'not-allowed',
                    opacity: selectedConcern ? 1 : 0.6,
                  }}
                  data-testid="button-consult-now"
                >
                  Consult Now
                </Button>
              </div>
            </div>
          ) : (
            <div data-testid="section-doctors-list">
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={handleBack}
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
                  {selectedConcern}
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
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
        </div>
      </main>
    </div>
  );
}
