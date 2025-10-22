export const ROUTES = {
  HOME: "/home",
  LOGIN: "/",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  HEALTH_ASSESSMENT: "/dashboard/health-assessment",
  METRICS_HISTORY: "/metrics",
  INSTANT_CONSULTATION: "/dashboard/consultation",
  FIND_DOCTOR: "/dashboard/doctors",
  FOOD_SCANNER: "/food-scanner",
  TIPS_EXERCISES: "/tips",
  MEDICAL_RECORDS: "/records",
  DIABOT: "/diabot",
  HEALTH_PLANS: "/plans",
  SETTINGS: "/settings",
  BLOGS: "/blogs",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
