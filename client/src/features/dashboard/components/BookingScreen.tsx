import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Calendar } from '@/components/common/Calendar';
import { TimePicker } from '@/components/common/TimePicker';
import { mockHospitals, type Hospital } from '@/mocks/hospitals';
import type { Doctor } from '@/mocks/doctors';
import { cn } from '@/lib/utils';

interface BookingScreenProps {
  doctor: Doctor;
  onBack: () => void;
  onProceed: (date: Date, time: string, hospital: Hospital) => void;
}

export function BookingScreen({ doctor, onBack, onProceed }: BookingScreenProps) {
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
          data-testid="text-page-title"
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
        className="p-4 sm:p-6 mb-4 sm:mb-6"
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
      <div className="mb-4 sm:mb-6" data-testid="section-time-picker">
        <TimePicker selectedTime={selectedTime} onTimeChange={setSelectedTime} />
      </div>

      {/* Hospital Selection */}
      <div className="mb-6 sm:mb-8">
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
