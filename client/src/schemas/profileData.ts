import { z } from 'zod';

export const profileDataSchema = z.object({
  gender: z.enum(['male', 'female'], {
    error: 'Please select a gender',
  }),
  birthDay: z.string().min(1, 'Day is required'),
  birthMonth: z.string().min(1, 'Month is required'),
  birthYear: z.string().min(1, 'Year is required'),
  diagnosisDay: z.string().min(1, 'Day is required'),
  diagnosisMonth: z.string().min(1, 'Month is required'),
  diagnosisYear: z.string().min(1, 'Year is required'),
  weight: z.string().min(1, 'Weight is required'),
  height: z.string().min(1, 'Height is required'),
  diabetesType: z.enum(['type1', 'type2', 'gestational', 'prediabetes'], {
    error: 'Please select diabetes type',
  }),
});

export type ProfileDataFormValues = z.infer<typeof profileDataSchema>;
