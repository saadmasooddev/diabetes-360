import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { TokenManager } from "@/utils/tokenManager";
import { ROUTES } from "@/config/routes";
import { utils } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { USER_ROLES } from "@shared/schema";

interface ProtectedRouteProps {
	permissions: string[];
	children: React.ReactNode;
}

export const ProtectedRoute = ({
	permissions,
	children,
}: ProtectedRouteProps) => {
	const [location, navigate] = useLocation();
	const { hasAnyPermission } = usePermissions();
	const { isAuthenticated, user } = useAuthStore();
	const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

	useEffect(() => {
		const hasTokens = TokenManager.hasTokens();
		setIsCheckingAuth(false);

		if (!isAuthenticated || !user || !hasTokens) {
			navigate(ROUTES.LOGIN);
			return;
		}

		if (user.role === USER_ROLES.CUSTOMER && !user.profileComplete) {
			return navigate(ROUTES.PROFILE_DATA)
		}

		const role = user.role;
		if (
			permissions &&
			permissions.length > 0 &&
			!hasAnyPermission(permissions)
		) {
			utils.roleAfterAuthNavigationMap[role]?.(
				{ user, tokens: TokenManager.getTokens()! },
				navigate,
			);
			return;
		}

		navigate(location);
	}, [isAuthenticated, user, navigate, location]);

	// Show loading or nothing while checking authentication
	if (isCheckingAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="flex flex-col items-center space-y-6">
					<div className="h-10 w-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin"></div>
					<span className="text-base text-gray-500 font-medium tracking-wide">
						Just a moment…
					</span>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};
