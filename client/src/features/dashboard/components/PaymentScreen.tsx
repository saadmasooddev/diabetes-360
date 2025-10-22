import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import type { Doctor } from '@/mocks/doctors';

interface PaymentScreenProps {
  doctor: Doctor;
  onBack: () => void;
}

export function PaymentScreen({ doctor, onBack }: PaymentScreenProps) {
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
