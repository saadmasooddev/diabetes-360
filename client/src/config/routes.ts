export const ROUTES = {
  // Auth Routes
  LOGIN: "/",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",

  // Main Routes
  HOME: "/dashboard/home",
  DASHBOARD: "/dashboard",

  // Dashboard Sub-routes
  HEALTH_ASSESSMENT: "/dashboard/health-assessment",
  INSTANT_CONSULTATION: "/dashboard/consultation",
  FIND_DOCTOR: "/dashboard/doctors",

  // Feature Routes
  METRICS_HISTORY: "/metrics",
  FOOD_SCANNER: "/dashboard/food-scanner",
  TIPS_EXERCISES: "/dashboard/tips",
  MEDICAL_RECORDS: "/dashboard/records",
  DIABOT: "/dashboard/diabot",
  HEALTH_PLANS: "/dashboard/plans",
  PAYMENTS: "/dashboard/payments",

  // Other Routes
  PROFILE_DATA: "/profile-data",
  BLOGS: "/blogs",
  SETTINGS: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
