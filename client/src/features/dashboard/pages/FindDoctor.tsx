import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, ArrowLeft, MapPin } from 'lucide-react';
import { mockDoctors, type Doctor } from '@/mocks/doctors';
import { mockHospitals, type Hospital } from '@/mocks/hospitals';
import { Calendar } from '@/components/common/Calendar';
import { TimePicker } from '@/components/common/TimePicker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SpecialtyFilter = 'All' | 'Diabetologist' | 'Nutritionist' | 'Health Coach';

const specialtyTabs: SpecialtyFilter[] = ['All', 'Diabetologist', 'Nutritionist', 'Health Coach'];

interface DoctorCardProps {
  doctor: Doctor;
  onConsultClick: (doctor: Doctor) => void;
}

function DoctorCard({ doctor, onConsultClick }: DoctorCardProps) {
  return (
    <Card
      className="p-6 flex gap-6"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}
      data-testid={`card-doctor-${doctor.id}`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-24 h-24 rounded-full object-cover"
          style={{
            border: '4px solid #E0F2F1',
          }}
          data-testid={`img-doctor-${doctor.id}`}
        />
        <div
          className="absolute top-0 left-0 flex items-center gap-1.5 px-2 py-1 rounded-full"
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
            className="mb-3"
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#00856F',
            }}
            data-testid={`text-specialty-${doctor.id}`}
          >
            {doctor.specialty}
          </p>

          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#00856F',
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
          </div>

          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#00856F',
              }}
            >
              Ratings
            </span>
            <div className="flex items-center gap-1" data-testid={`rating-${doctor.id}`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.floor(doctor.rating) ? '#00856F' : 'none'}
                  stroke={i < Math.floor(doctor.rating) ? '#00856F' : '#B0BEC5'}
                  data-testid={`star-${i + 1}-${doctor.id}`}
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={() => onConsultClick(doctor)}
          className="w-full mt-4"
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

interface BookingScreenProps {
  doctor: Doctor;
  onBack: () => void;
  onProceed: (date: Date, time: string, hospital: Hospital) => void;
}

function BookingScreen({ doctor, onBack, onProceed }: BookingScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('11:38 AM');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const handleProceedBooking = () => {
    if (selectedDate && selectedHospital) {
      onProceed(selectedDate, selectedTime, selectedHospital);
    }
  };

  return (
    <div className="w-full max-w-[800px]">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E0F2F1] transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={24} color="#00856F" />
        </button>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#00856F',
          }}
          data-testid="text-page-title"
        >
          Book a Consultation
        </h1>
      </div>

      {/* Doctor Information */}
      <div className="mb-8">
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#00453A',
          }}
          data-testid="text-doctor-name"
        >
          {doctor.name}
        </h2>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: '#00856F',
          }}
          data-testid="text-doctor-specialty"
        >
          {doctor.specialty}
        </p>
      </div>

      {/* Calendar */}
      <Card
        className="p-6 mb-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
        data-testid="card-calendar"
      >
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </Card>

      {/* Time Picker */}
      <div className="mb-6" data-testid="section-time-picker">
        <TimePicker selectedTime={selectedTime} onTimeChange={setSelectedTime} />
      </div>

      {/* Hospital Selection */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockHospitals.map((hospital) => (
            <button
              key={hospital.id}
              onClick={() => setSelectedHospital(hospital)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-all',
                selectedHospital?.id === hospital.id
                  ? 'border-[#00856F] bg-[#E0F2F1]'
                  : 'border-gray-200 bg-white hover:bg-[#F7F9F9]'
              )}
              style={{
                borderRadius: '8px',
              }}
              data-testid={`button-hospital-${hospital.id}`}
            >
              <MapPin
                size={20}
                color={selectedHospital?.id === hospital.id ? '#00856F' : '#546E7A'}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: selectedHospital?.id === hospital.id ? '#00453A' : '#546E7A',
                }}
              >
                {hospital.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Proceed Booking Button */}
      <Button
        onClick={handleProceedBooking}
        disabled={!selectedDate || !selectedHospital}
        className="w-full"
        style={{
          background: selectedDate && selectedHospital ? '#00856F' : '#B0BEC5',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '16px',
          padding: '16px 32px',
          borderRadius: '8px',
          height: 'auto',
        }}
        data-testid="button-proceed-booking"
      >
        Proceed Booking
      </Button>
    </div>
  );
}

interface ConfirmationScreenProps {
  doctor: Doctor;
  date: Date;
  time: string;
  hospital: Hospital;
  onBack: () => void;
}

function ConfirmationScreen({ doctor, date, time, hospital, onBack }: ConfirmationScreenProps) {
  const formattedDate = format(date, 'd MMMM yyyy');

  return (
    <div className="w-full max-w-[800px]">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E0F2F1] transition-colors"
          data-testid="button-back-confirmation"
        >
          <ArrowLeft size={24} color="#00856F" />
        </button>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#00856F',
          }}
          data-testid="text-confirmation-title"
        >
          Confirmation
        </h1>
      </div>

      {/* Confirmation Card */}
      <Card
        className="p-8 mb-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
        data-testid="card-confirmation"
      >
        {/* Doctor Information */}
        <div className="mb-6">
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-confirmation-doctor-name"
          >
            {doctor.name}
          </h2>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#00856F',
            }}
            data-testid="text-confirmation-doctor-specialty"
          >
            {doctor.specialty}
          </p>
        </div>

        {/* Date & Time Section */}
        <div className="mb-6">
          <h3
            className="mb-3"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-date-time-label"
          >
            Date & Time
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: '#F7F9F9',
              }}
              data-testid="display-date"
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
              >
                {formattedDate}
              </span>
            </div>
            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: '#F7F9F9',
              }}
              data-testid="display-time"
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
              >
                {time}
              </span>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div>
          <h3
            className="mb-3"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-location-label"
          >
            Location
          </h3>
          <div
            className="p-4 rounded-lg text-center"
            style={{
              background: '#F7F9F9',
            }}
            data-testid="display-hospital"
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#00453A',
              }}
            >
              {hospital.name}
            </span>
          </div>
        </div>
      </Card>

      {/* Appointment Booked Banner */}
      <div
        className="w-full py-6 rounded-lg text-center"
        style={{
          background: '#E0F2F1',
        }}
        data-testid="banner-appointment-booked"
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#00453A',
          }}
        >
          Appointment Booked
        </h2>
      </div>
    </div>
  );
}

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

      <main className="flex-1 flex justify-center items-start pt-8 pb-8">
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
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2" data-testid="section-specialty-tabs">
              {specialtyTabs.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={cn(
                    'px-6 py-2 rounded-full whitespace-nowrap transition-all',
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
