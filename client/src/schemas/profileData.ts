import { z } from 'zod';

export const profileDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select a gender',
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
    required_error: 'Please select diabetes type',
  }),
});

export type ProfileDataFormValues = z.infer<typeof profileDataSchema>;
