import { useAuthStore } from '@/stores/authStore';
import {  hasAnyPermission,  type Permission } from '@/utils/permissions';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  return {
    permissions,
    hasAnyPermission: (permissionList: Permission[]) => hasAnyPermission(permissions, permissionList),
  };
}

