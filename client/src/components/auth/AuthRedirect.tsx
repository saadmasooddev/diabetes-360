import { ROUTES } from "@/config/routes";
import { utils } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { TokenManager } from "@/utils/tokenManager";
import { useEffect } from "react";
import { useLocation } from "wouter";

export const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
	const [location, navigate] = useLocation();
	const { isAuthenticated, user } = useAuthStore();
	const authRoutes = [ROUTES.LOGIN, ROUTES.SIGNUP];

	useEffect(() => {
		const hasTokens = TokenManager.hasTokens();
		if (!user || !isAuthenticated || !hasTokens) return;

		const role = user.role;
		const isAuthRoute = authRoutes.includes(location as any);
		if (!isAuthRoute) return;

		const tokens = TokenManager.getTokens();
		utils.roleAfterAuthNavigationMap[role]?.(
			{ user, tokens: tokens! },
			navigate,
		);
	}, [user, location, navigate, isAuthenticated]);
	return <>{children}</>;
};
