export const ROUTES = {
  // Auth Routes
  LOGIN: "/",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Dashboard
  HOME: "/dashboard/home",
  DASHBOARD: "/dashboard/my-dashboard",
  HEALTH_ASSESSMENT: "/dashboard/health-assessment",
  HEALTH_METRICS_HISTORY: "/dashboard/health-metrics-history",
  INSTANT_CONSULTATION: "/dashboard/consultation",
  CONSULTATIONS: "/dashboard/consultations",
  FIND_DOCTOR: "/dashboard/doctors",
  SETTINGS: "/dashboard/settings",
  FOOD_SCANNER: "/dashboard/food-scanner",
  TIPS_EXERCISES: "/dashboard/tips",
  MEDICAL_RECORDS: "/dashboard/records",
  DIABOT: "/dashboard/diabot",
  HEALTH_PLANS: "/dashboard/plans",
  PAYMENTS: "/dashboard/payments",
  STRENGTH_TRAINING_PROGRESS: "/dashboard/strength-training",

  // Feature Routes
  METRICS_HISTORY: "/metrics",

  // Other Routes
  PROFILE_DATA: "/profile-data",
  BLOGS: "/blogs",

} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
