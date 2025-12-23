// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  PHYSICIAN: 'physician',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.CUSTOMER]: [
    'read:own_profile',
    'update:own_profile',
    'read:own_health_metrics',
    'create:own_health_metrics',
    'update:own_health_metrics',
    'delete:own_health_metrics',
    'read:health_targets',
    'write:own_health_targets',
    'scan:food',
    'read:own_medical_records',
    'create:own_medical_records',
    'update:own_medical_records',
    'delete:own_medical_records',
  ],
  [USER_ROLES.PHYSICIAN]: [
    'read:own_profile',
    'update:own_profile',
    'read:own_health_metrics',
    'create:own_health_metrics',
    'update:own_health_metrics',
    'delete:own_health_metrics',
    'read:patient_profiles',
    'read:patient_health_metrics',
    'create:patient_health_metrics',
    'update:patient_health_metrics',
    'read:patient_medical_records',
    'create:patient_medical_records',
  ],
  [USER_ROLES.ADMIN]: [
    'read:own_profile',
    'update:own_profile',
    'read:own_health_metrics',
    'create:own_health_metrics',
    'update:own_health_metrics',
    'delete:own_health_metrics',
    'read:all_users',
    'create:users',
    'update:users',
    'delete:users',
    'read:all_health_metrics',
    'create:all_health_metrics',
    'update:all_health_metrics',
    'delete:all_health_metrics',
    'create:settings',
    'read:settings',
    'update:settings',
    'delete:settings',
    'read:health_targets',
    'write:health_targets',
    'write:own_health_targets',
    'read:all_medical_records',
    'create:all_medical_records',
    'update:all_medical_records',
    'delete:all_medical_records',
  ],
} as const;

export type Permission = typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS][number];

// Helper function to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission as any);
}

// Helper function to check if a role can access another role's resources
export function canAccessRole(currentRole: UserRole, targetRole: UserRole): boolean {
  switch (currentRole) {
    case USER_ROLES.ADMIN:
      return true; // Admin can access all roles
    case USER_ROLES.PHYSICIAN:
      return targetRole === USER_ROLES.CUSTOMER; // Physician can access customer data
    case USER_ROLES.CUSTOMER:
      return targetRole === USER_ROLES.CUSTOMER; // Customer can only access their own data
    default:
      return false;
  }
}
