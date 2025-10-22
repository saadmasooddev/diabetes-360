export const ROUTES = {
  HOME: '/home',
  LOGIN: '/',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  HEALTH_ASSESSMENT: '/dashboard/health-assessment',
  INSTANT_CONSULTATION: '/dashboard/consultation',
  METRICS_HISTORY: '/metrics',
  FIND_DOCTOR: '/doctors',
  FOOD_SCANNER: '/food-scanner',
  TIPS_EXERCISES: '/tips',
  MEDICAL_RECORDS: '/records',
  DIABOT: '/diabot',
  SETTINGS: '/settings',
  BLOGS: '/blogs',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
