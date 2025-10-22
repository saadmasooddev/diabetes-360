export const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const diabetesTypeOptions = [
  { value: 'type1', label: 'Type 1 Diabetes' },
  { value: 'type2', label: 'Type 2 Diabetes' },
  { value: 'gestational', label: 'Gestational Diabetes' },
  { value: 'prediabetes', label: 'Prediabetes' },
];

export const dayOptions = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}));

export const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}));

const currentYear = new Date().getFullYear();
export const yearOptions = Array.from({ length: 100 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

export const weightOptions = Array.from({ length: 200 }, (_, i) => ({
  value: String(i + 20),
  label: String(i + 20),
}));

export const heightOptions = Array.from({ length: 150 }, (_, i) => ({
  value: String(i + 100),
  label: String(i + 100),
}));
