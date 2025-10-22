import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';
import { mockDoctors, type Doctor } from '@/mocks/doctors';
import { cn } from '@/lib/utils';

type SpecialtyFilter = 'All' | 'Diabetologist' | 'Nutritionist' | 'Health Coach';

const specialtyTabs: SpecialtyFilter[] = ['All', 'Diabetologist', 'Nutritionist', 'Health Coach'];

function DoctorCard({ doctor }: { doctor: Doctor }) {
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

export function FindDoctor() {
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

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex justify-center items-start pt-8 pb-8">
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
                <DoctorCard key={doctor.id} doctor={doctor} />
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
      </main>
    </div>
  );
}
