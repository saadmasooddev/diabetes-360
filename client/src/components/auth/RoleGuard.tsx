import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'wouter';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('customer' | 'admin' | 'physician')[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function CustomerGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard allowedRoles={['customer']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PhysicianGuard({ children, fallback }: GuardProps) {
  return (
    <RoleGuard allowedRoles={['physician']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
