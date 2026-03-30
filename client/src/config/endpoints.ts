import type { MetricType } from "@shared/schema";

export const API_ENDPOINTS = {
  BASE: "",
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESEND_VERIFICATION_OTP: "/api/auth/resend-verification-otp",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    CHANGE_PASSWORD: "/api/auth/change-password",
    VERIFY_2FA: "/api/auth/verify-2fa",
  },
  USER: {
    PROFILE: "/api/user/profile",
    UPDATE: "/api/user/update",
  },
  HEALTH: {
    LATEST: "/api/health/metrics/latest",
    STATISTICS: "/api/health/metrics/statistics",
    FILTERED: "/api/health/metrics/filtered",
    INSIGHTS: "/api/health/insights",
    UPLOAD_GLUCOSE_IMAGE: "/api/health/metrics/upload-glucose-image",
    TARGETS: {
      BASE: "/api/health/targets",
      RECOMMENDED: "/api/health/targets/recommended",
      RECOMMENDED_BATCH: "/api/health/targets/recommended/batch",
      USER: "/api/health/targets/user",
      USER_BATCH: "/api/health/targets/user/batch",
      DELETE_USER: (metricType: MetricType) =>
        `/api/health/targets/user/${metricType}`,
    },
    ACTIVITIES: {
      ADD: "/api/health/activities/add",
    },
    DAILY_QUICK_LOGS: "/api/health/daily-quick-logs",
    EXERCISES: {
      ADD_BATCH: "/api/health/exercises/add/batch",
      TODAY_TOTALS: "/api/health/exercises/today/totals",
      STRENGTH_PROGRESS: "/api/health/exercises/strength-progress",
      CALORIES_BY_ACTIVITY: "/api/health/exercises/calories-by-activity",
    },
  },
  ADMIN: {
    USERS: "/api/admin/users",
  },
  SETTINGS: {
    LIMITS: "/api/settings/limits",
    FOOD_SCAN_STATUS: "/api/settings/food-scan-status",
  },
  TWO_FACTOR: {
    STATUS: "/api/two-factor/status",
    SETUP: "/api/two-factor/setup",
    VERIFY: "/api/two-factor/verify",
    DISABLE: "/api/two-factor/disable",
    REGENERATE_BACKUP_CODES: "/api/two-factor/regenerate-backup-codes",
  },
  PHYSICIAN: {
    SPECIALTIES: "/api/physician/specialties",
    ALL_PHYSICIANS: "/api/physician/physicians",
    PHYSICIANS_BY_SPECIALTY: (specialtyId: string) =>
      `/api/physician/specialties/${specialtyId}/physicians`,
    RATING: (physicianId: string) => `/api/physician/ratings/${physicianId}`,
    LOCATIONS: "/api/physician/locations",
    LOCATION_BY_ID: (id: string) => `/api/physician/locations/${id}`,
    PATIENTS: "/api/physician/patients",
    PATIENT_STATS: "/api/physician/patients/stats",
    PATIENT_BY_ID: (patientId: string) =>
      `/api/physician/patients/${patientId}`,
    PATIENT_ALERTS: "/api/physician/patient-alerts",
    ADMIN: {
      SPECIALTIES: "/api/physician/admin/specialties",
      SPECIALTY_BY_ID: (id: string) => `/api/physician/admin/specialties/${id}`,
      PHYSICIAN_DATA: (userId: string) =>
        `/api/physician/admin/physician-data/${userId}`,
      PROFILE_IMAGE_UPLOAD_URL: (userId: string) =>
        `/api/physician/admin/physician-data/${userId}/profile-image/upload-url`,
      PROFILE_IMAGE_CONFIRM: (userId: string) =>
        `/api/physician/admin/physician-data/${userId}/profile-image/confirm`,
      LOCATIONS: (physicianId: string) =>
        `/api/physician/admin/locations/${physicianId}`,
    },
  },
  CUSTOMER: {
    PROFILE: "/api/customer/profile",
    CONSULTATION_QUOTAS: "/api/customer/consultation-quotas",
  },
  BOOKING: {
    MEETING_LINK: (bookingId: string) => `/api/booking/${bookingId}/meeting-link`,
    SLOT_SIZES: "/api/booking/slot-sizes",
    SLOT_TYPES: "/api/booking/slot-types",
    AVAILABILITY_DATES: "/api/booking/availability-dates",
    CREATE_SLOTS: "/api/booking/slots",
    DATES_WITH_AVAILABILITY: (physicianId: string) =>
      `/api/booking/physicians/${physicianId}/dates-with-availability`,
    PHYSICIAN_DATES: (physicianId: string) =>
      `/api/booking/physicians/${physicianId}/dates`,
    PHYSICIAN_SLOTS: (physicianId: string) =>
      `/api/booking/physicians/${physicianId}/slots`,
    AVAILABLE_SLOTS: (physicianId: string) =>
      `/api/booking/physicians/${physicianId}/available-slots`,
    DELETE_SLOT: (slotId: string) => `/api/booking/slots/${slotId}`,
    UPDATE_SLOT_LOCATIONS: (slotId: string) =>
      `/api/booking/slots/${slotId}/locations`,
    UPDATE_SLOT: (slotId: string) => `/api/booking/slots/${slotId}`,
    BOOK_SLOT: "/api/booking/book",
    CALCULATE_BOOKING_PRICE: (physicianId: string) =>
      `/api/booking/physicians/${physicianId}/calculate-price`,
    MY_CONSULTATIONS: "/api/booking/my-consultations",
    MARK_ATTENDED: (bookingId: string) =>
      `/api/booking/consultations/${bookingId}/attend`,
    UPDATE_CONSULTATION_STATUS: (bookingId: string) =>
      `/api/booking/consultations/${bookingId}/status`,
    UPDATE_CONSULTATION_NOTE: (bookingId: string) =>
      `/api/booking/consultations/${bookingId}/note`,
    APPOINTMENTS: "/api/booking/appointments",
    DATES_WITH_BOOKINGS: "/api/booking/dates-with-bookings",
    GENERATE_SLOTS_FOR_DAY: "/api/booking/generate-slots-for-day",
    BULK_DELETE_SLOTS: "/api/booking/bulk-delete-slots",
    CREATE_CUSTOM_SLOT: "/api/booking/custom-slot",
  },
  FOOD_SCANNER: {
    SCAN: "/api/food/scan",
    DAILY_DATA: "/api/food/daily-data",
    NUTRITION_CONSUMED: "/api/food/nutrition/consumed",
    RECIPE_DETAILS: "/api/food/details",
    LOG_MEAL: "/api/food/log-meal",
    CALORIE_PROFILE: "/api/food/calorie-profile",
  },
  CHAT: {
    BASE: "/api/chat",
    TRANSCRIBE_AUDIO: "/api/chat/transcribe-audio",
  },
  MEDICAL: {
    MEDICATIONS: "/api/medical/medications",
    MEDICATIONS_BY_CONSULTATION_ID: "/api/medical/medications/by-consultation",
    LAB_REPORTS: "/api/medical/lab-reports",
    LAB_REPORTS_BY_USER: (userId: string) =>
      `/api/medical/lab-reports/by-user/${userId}`,
    LAB_REPORT_REQUEST_UPLOAD: "/api/medical/lab-reports/request-upload",
    LAB_REPORT_CONFIRM: (id: string) =>
      `/api/medical/lab-reports/${id}/confirm`,
    LAB_REPORT_DOWNLOAD_URL: (id: string) =>
      `/api/medical/lab-reports/${id}/download-url`,
    LAB_REPORT_DELETE: (id: string) => `/api/medical/lab-reports/${id}`,
  },
} as const;
