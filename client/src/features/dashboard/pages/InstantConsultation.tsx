import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, ArrowLeft, Stethoscope, Apple, Heart, Activity } from 'lucide-react';
import { mockDoctors, type Doctor } from '@/mocks/doctors';
import { mockConcerns, type Concern } from '@/mocks/concerns';

const concernIcons = {
  stethoscope: Stethoscope,
  apple: Apple,
  'heart-pulse': Heart,
  activity: Activity,
};

type ConsultationStep = 'concern' | 'doctors' | 'payment';

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

function DoctorCard({ 
  doctor, 
  onConsultClick 
}: { 
  doctor: Doctor;
  onConsultClick: (doctor: Doctor) => void;
}) {
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
          onClick={() => onConsultClick(doctor)}
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

function PaymentScreen({ 
  doctor, 
  onBack 
}: { 
  doctor: Doctor;
  onBack: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');

  const consultationFee = 999;
  const tax = 0;
  const total = consultationFee + tax;

  const getCurrentDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return now.toLocaleString('en-US', options);
  };

  return (
    <div data-testid="section-payment">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
          data-testid="button-back-payment"
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
          data-testid="text-payment-title"
        >
          Payment
        </h1>
      </div>

      <Card
        className="p-8 mb-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
        data-testid="card-payment-details"
      >
        <div className="mb-6">
          <h2
            className="mb-2"
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-consultation-title"
          >
            Instant Video Consultation
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#78909C',
            }}
            data-testid="text-consultation-datetime"
          >
            {getCurrentDateTime()}
          </p>
        </div>

        {/* Doctor Information */}
        <div className="mb-6 p-4 rounded-lg" style={{ background: '#F7F9F9' }}>
          <p
            className="mb-2"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#00856F',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
            data-testid="text-doctor-label"
          >
            Consulting Doctor
          </p>
          <div className="flex items-center gap-3">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
              style={{
                border: '2px solid #E0F2F1',
              }}
              data-testid="img-selected-doctor"
            />
            <div>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#00453A',
                }}
                data-testid="text-selected-doctor-name"
              >
                {doctor.name}
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: '#00856F',
                }}
                data-testid="text-selected-doctor-specialty"
              >
                {doctor.specialty}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3
            className="mb-4"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-order-details-title"
          >
            Order Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span
                style={{
                  fontSize: '14px',
                  color: '#78909C',
                }}
                data-testid="text-amount-label"
              >
                Amount
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
                data-testid="text-amount-value"
              >
                PKR {consultationFee}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span
                style={{
                  fontSize: '14px',
                  color: '#78909C',
                }}
                data-testid="text-tax-label"
              >
                GST/Sales Tax
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
                data-testid="text-tax-value"
              >
                PKR {tax}
              </span>
            </div>
            
            <div
              className="flex justify-between items-center pt-3"
              style={{
                borderTop: '1px solid #E0E0E0',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#00453A',
                }}
                data-testid="text-total-label"
              >
                Total
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#00856F',
                }}
                data-testid="text-total-value"
              >
                PKR {total}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3
            className="mb-4"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#00453A',
            }}
            data-testid="text-payment-method-title"
          >
            Payment Method
          </h3>
          
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={setPaymentMethod}
            data-testid="radiogroup-payment-method"
          >
            <div
              className="flex items-center space-x-3 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => setPaymentMethod('bank-transfer')}
              data-testid="option-bank-transfer"
            >
              <RadioGroupItem value="bank-transfer" id="bank-transfer" />
              <Label
                htmlFor="bank-transfer"
                className="cursor-pointer flex-1"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
              >
                Bank Transfer
              </Label>
            </div>

            <div
              className="flex items-center space-x-3 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mt-3"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => setPaymentMethod('credit-card')}
              data-testid="option-credit-card"
            >
              <RadioGroupItem value="credit-card" id="credit-card" />
              <Label
                htmlFor="credit-card"
                className="cursor-pointer flex-1"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
              >
                Credit/Debit Card
              </Label>
            </div>

            <div
              className="flex items-center space-x-3 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mt-3"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => setPaymentMethod('mobile-wallet')}
              data-testid="option-mobile-wallet"
            >
              <RadioGroupItem value="mobile-wallet" id="mobile-wallet" />
              <Label
                htmlFor="mobile-wallet"
                className="cursor-pointer flex-1"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#00453A',
                }}
              >
                Mobile Wallet
              </Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      <Button
        className="w-full"
        style={{
          background: '#00856F',
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '16px',
          padding: '16px 32px',
          borderRadius: '8px',
          height: 'auto',
        }}
        data-testid="button-proceed-payment"
      >
        Proceed Payment
      </Button>
    </div>
  );
}

export function InstantConsultation() {
  const [currentStep, setCurrentStep] = useState<ConsultationStep>('concern');
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const filteredDoctors = selectedConcern
    ? mockDoctors.filter((doctor) => doctor.specialty === selectedConcern)
    : [];

  const handleConcernSelect = (concernSpecialty: string) => {
    setSelectedConcern(concernSpecialty);
  };

  const handleConsultNow = () => {
    if (selectedConcern) {
      setCurrentStep('doctors');
    }
  };

  const handleDoctorConsult = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep('payment');
  };

  const handleBackFromDoctors = () => {
    setCurrentStep('concern');
    setSelectedConcern(null);
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
                {mockConcerns.map((concern) => (
                  <ConcernCard
                    key={concern.id}
                    concern={concern}
                    isSelected={selectedConcern === concern.specialty}
                    onClick={() => handleConcernSelect(concern.specialty)}
                  />
                ))}
              </div>

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
                  {selectedConcern}
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
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
