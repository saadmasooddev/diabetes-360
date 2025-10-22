import doctorImage from '@assets/stock_images/professional_female__7f02b2b3.jpg';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  isOnline: boolean;
  image: string;
}

export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Samreen Akhtar',
    specialty: 'Diabetologist',
    experience: '6+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '2',
    name: 'Dr. Ahmed Khan',
    specialty: 'Diabetologist',
    experience: '8+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '3',
    name: 'Dr. Sarah Johnson',
    specialty: 'Diabetologist',
    experience: '5+ years',
    rating: 4,
    isOnline: false,
    image: doctorImage,
  },
  {
    id: '4',
    name: 'Dr. Maria Rodriguez',
    specialty: 'Nutritionist',
    experience: '7+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '5',
    name: 'Dr. Emily Chen',
    specialty: 'Nutritionist',
    experience: '4+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '6',
    name: 'Dr. Jennifer Williams',
    specialty: 'Health Coach',
    experience: '10+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '7',
    name: 'Dr. Michael Brown',
    specialty: 'Health Coach',
    experience: '6+ years',
    rating: 4,
    isOnline: false,
    image: doctorImage,
  },
  {
    id: '8',
    name: 'Dr. David Lee',
    specialty: 'Endocrinologist',
    experience: '12+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
  {
    id: '9',
    name: 'Dr. Lisa Anderson',
    specialty: 'Endocrinologist',
    experience: '9+ years',
    rating: 5,
    isOnline: true,
    image: doctorImage,
  },
];
