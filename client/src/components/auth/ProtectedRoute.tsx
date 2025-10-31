import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';
import { TokenManager } from '@/utils/tokenManager';
import { ROUTES } from '@/config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    // Check if user has valid tokens
    const hasTokens = TokenManager.hasTokens();
    setIsCheckingAuth(false);

    if (!isAuthenticated || !user || !hasTokens) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // If user is authenticated and trying to access an invalid route, redirect to dashboard
    const validRoutes = Object.values(ROUTES);
    if (!validRoutes.includes(location as any)) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, user, navigate, location]);

  // Show loading or nothing while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-10 w-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin"></div>
          <span className="text-base text-gray-500 font-medium tracking-wide">Just a moment…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
