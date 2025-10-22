export interface PlanFeature {
  id: string;
  text: string;
}

export interface HealthPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  bgColor: string;
}

export const healthPlans: HealthPlan[] = [
  {
    id: 'silver',
    name: 'Silver Plan',
    monthlyPrice: 2000,
    yearlyPrice: 26000,
    bgColor: '#E8F5F3',
    features: [
      {
        id: 'silver-1',
        text: 'CGM Device Integration',
      },
      {
        id: 'silver-2',
        text: 'Bi-Weekly 15-Minute Consultations',
      },
      {
        id: 'silver-3',
        text: 'Moderate-Priority Support',
      },
      {
        id: 'silver-4',
        text: 'Personalized Meal & Exercise Plans',
      },
    ],
  },
  {
    id: 'gold',
    name: 'Gold Plan',
    monthlyPrice: 3000,
    yearlyPrice: 34000,
    bgColor: '#E8F5F3',
    features: [
      {
        id: 'gold-1',
        text: 'All Silver Features',
      },
      {
        id: 'gold-2',
        text: 'Weekly 30-Minute Consultations',
      },
      {
        id: 'gold-3',
        text: 'Dedicated Health Coach',
      },
      {
        id: 'gold-4',
        text: 'Premium Content Library',
      },
      {
        id: 'gold-5',
        text: 'Highest-Priority Support',
      },
      {
        id: 'gold-6',
        text: 'Full Analytics Dashboard',
      },
    ],
  },
];
