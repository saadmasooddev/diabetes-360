import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import doctorImage from '@assets/stock_images/professional_female__7f02b2b3.jpg';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  isOnline: boolean;
  image: string;
}

const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '2',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '3',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: false,
    image: doctorImage,
  },
  {
    id: '4',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '5',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '6',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist & Nutritionist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
];

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
  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-8">
        <div className="w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            data-testid="section-doctors-list"
          >
            {mockDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
