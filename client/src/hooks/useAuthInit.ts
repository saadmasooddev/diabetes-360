import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { TokenManager } from "@/utils/tokenManager";
import { useLocation } from "wouter";
import { usePathname } from "wouter/use-browser-location";
import { ROUTES } from "@/config/routes";

export const useAuthInit = () => {
	const { logout } = useAuthStore();
	const [, navigate] = useLocation();
	const pathname = usePathname();

	useEffect(() => {
		const initAuth = async () => {
			const hasTokens = TokenManager.hasTokens();

			if (!hasTokens) {
				logout();
				return;
			}

			const accessToken = TokenManager.getAccessToken();

			if (!accessToken) {
				logout();
			}

			if (pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP) {
				navigate(ROUTES.DASHBOARD);
			}
		};

		initAuth();
	}, [logout]);
};
