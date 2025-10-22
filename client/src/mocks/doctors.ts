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
