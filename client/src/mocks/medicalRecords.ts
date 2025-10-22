export interface GlucoseLog {
  id: number;
  date: string;
  time: string;
  level: number;
  mealContext: string;
}

export interface Consultation {
  id: number;
  date: string;
  provider: string;
  specialty: string;
  summary: string;
}

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
}

export interface LabReport {
  id: number;
  date: string;
  type: string;
  fileName: string;
  fileUrl: string;
}

export const glucoseLogs: GlucoseLog[] = [];

export const consultations: Consultation[] = [
  {
    id: 1,
    date: "Jul 10, 2025",
    provider: "Dr. Ayesha Khan",
    specialty: "Diabetologist",
    summary: "Reviewed insulin dosage; recommended meal timing adjustment.",
  },
  {
    id: 2,
    date: "Jul 15, 2025",
    provider: "Dr. Samad Aslam",
    specialty: "Nutritionist",
    summary: "Reviewed Daily Nutrition; recommended healthy nutrition.",
  },
];

export const medications: Medication[] = [];

export const labReports: LabReport[] = [];
