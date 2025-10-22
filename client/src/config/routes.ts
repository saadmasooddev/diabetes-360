export const ROUTES = {
  // Auth Routes
  LOGIN: "/",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  
  // Main Routes
  HOME: "/home",
  DASHBOARD: "/dashboard",
  
  // Dashboard Sub-routes
  HEALTH_ASSESSMENT: "/dashboard/health-assessment",
  INSTANT_CONSULTATION: "/dashboard/consultation",
  FIND_DOCTOR: "/dashboard/doctors",
  
  // Feature Routes
  METRICS_HISTORY: "/metrics",
  FOOD_SCANNER: "/food-scanner",
  TIPS_EXERCISES: "/tips",
  MEDICAL_RECORDS: "/records",
  DIABOT: "/diabot",
  HEALTH_PLANS: "/plans",
  PAYMENTS: "/payments",
  
  // Other Routes
  BLOGS: "/blogs",
  SETTINGS: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
