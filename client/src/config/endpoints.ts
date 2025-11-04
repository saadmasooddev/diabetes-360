export const API_ENDPOINTS = {
  BASE: '',
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
  },
  HEALTH: {
    METRICS: '/api/health/metrics',
    LATEST: '/api/health/metrics/latest',
    ADD: '/api/health/metrics/add',
    CHART: '/api/health/metrics/chart',
    TODAY_COUNT: '/api/health/metrics/today-count',
    STATISTICS: '/api/health/metrics/statistics',
  },
  ADMIN: {
    USERS: '/api/admin/users',
  },
  SETTINGS: {
    FREE_TIER_LIMITS: '/api/settings/free-tier-limits',
  },
  PHYSICIAN: {
    SPECIALTIES: '/api/physician/specialties',
    PHYSICIANS_BY_SPECIALTY: (specialtyId: string) => `/api/physician/specialties/${specialtyId}/physicians`,
    RATING: (physicianId: string) => `/api/physician/ratings/${physicianId}`,
    ADMIN: {
      SPECIALTIES: '/api/physician/admin/specialties',
      SPECIALTY_BY_ID: (id: string) => `/api/physician/admin/specialties/${id}`,
      PHYSICIAN_DATA: (userId: string) => `/api/physician/admin/physician-data/${userId}`,
      UPLOAD_IMAGE: '/api/physician/admin/upload-image',
    },
  },
  CUSTOMER: {
    PROFILE: '/api/customer/profile',
  },
} as const;
