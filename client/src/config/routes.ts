export const DOCTOR_DASHBOARD_PREFIX = "/dashboard/doctor";
export const ADMIN_DASHBOARD_PREFIX = "/dashboard/admin";
export const USER_DASHBOARD_PREFIX = "/dashboard/user";
export const AUTH_PREFIX = "/auth";
export const COMMON_PREFIX = "/common";

export const ROUTES = {
	// Auth Routes
	LOGIN: `${AUTH_PREFIX}/login`,
	SIGNUP: `${AUTH_PREFIX}/signup`,
	VERIFY_EMAIL: `${AUTH_PREFIX}/verify-email`,
	FORGOT_PASSWORD: `${AUTH_PREFIX}/forgot-password`,
	RESET_PASSWORD: `${AUTH_PREFIX}/reset-password`,

	// Dashboard
	HOME: `${USER_DASHBOARD_PREFIX}/home`,
	DASHBOARD: `${USER_DASHBOARD_PREFIX}/my-dashboard`,
	HEALTH_ASSESSMENT: `${USER_DASHBOARD_PREFIX}/health-assessment`,
	HEALTH_METRICS_HISTORY: `${USER_DASHBOARD_PREFIX}/health-metrics-history`,
	INSTANT_CONSULTATION: `${USER_DASHBOARD_PREFIX}/consultation`,
	CONSULTATIONS: `${USER_DASHBOARD_PREFIX}/consultations`,
	FIND_DOCTOR: `${USER_DASHBOARD_PREFIX}/doctors`,
	FOOD_SCANNER: `${USER_DASHBOARD_PREFIX}/food-scanner`,
	TIPS_EXERCISES: `${USER_DASHBOARD_PREFIX}/tips`,
	MEDICAL_RECORDS: `${USER_DASHBOARD_PREFIX}/records`,
	MEDICATIONS: `${USER_DASHBOARD_PREFIX}/medications`,
	DIABOT: `${USER_DASHBOARD_PREFIX}/diabot`,
	HEALTH_PLANS: `${USER_DASHBOARD_PREFIX}/plans`,
	PAYMENTS: `${USER_DASHBOARD_PREFIX}/payments`,
	STRENGTH_TRAINING_PROGRESS: `${USER_DASHBOARD_PREFIX}/strength-training`,
	RECIPE_DETAIL: `${USER_DASHBOARD_PREFIX}/recipe`,
	PROFILE_DATA: `${USER_DASHBOARD_PREFIX}/profile-data`,

	// Doctor Routes
	DOCTOR_HOME: `${DOCTOR_DASHBOARD_PREFIX}/home`,
	DOCTOR_APPOINTMENTS: `${DOCTOR_DASHBOARD_PREFIX}/appointments`,
	DOCTOR_PATIENTS: `${DOCTOR_DASHBOARD_PREFIX}/patients`,
	DOCTOR_PATIENTS_ALERTS: `${DOCTOR_DASHBOARD_PREFIX}/alerts`,
	DOCTOR_PATIENT_PROFILE: `${DOCTOR_DASHBOARD_PREFIX}/patients/:profileId/profile`,

	ADMIN_HOME: `${ADMIN_DASHBOARD_PREFIX}/home`,
	ADMIN_APPOINTMENTS: `${ADMIN_DASHBOARD_PREFIX}/appointments`,
	ADMIN_PATIENTS: `${ADMIN_DASHBOARD_PREFIX}/patients`,
	ADMIN_PATIENTS_ALERTS: `${ADMIN_DASHBOARD_PREFIX}/alerts`,
	ADMIN_PATIENT_PROFILE: `${ADMIN_DASHBOARD_PREFIX}/patients/:profileId/profile`,

	SETTINGS: `${COMMON_PREFIX}/settings`,
	BLOGS: `${COMMON_PREFIX}/blogs`,
	MEETING_LINK: `${COMMON_PREFIX}/meeting/link/:bookingId`,
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
