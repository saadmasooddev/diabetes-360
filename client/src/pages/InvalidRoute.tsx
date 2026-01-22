import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";
import { TokenManager } from "@/utils/tokenManager";
import { ROUTES } from "@/config/routes";

export default function InvalidRoute() {
	const [, navigate] = useLocation();
	const { isAuthenticated, user } = useAuthStore();

	useEffect(() => {
		// Check if user has valid tokens
		const hasTokens = TokenManager.hasTokens();

		if (isAuthenticated && user && hasTokens) {
			// User is authenticated, redirect to dashboard
			navigate(ROUTES.DASHBOARD);
		} else {
			// User is not authenticated, redirect to login
			navigate(ROUTES.LOGIN);
		}
	}, [isAuthenticated, user, navigate]);

	// Show loading while redirecting
	return (
		<div className="min-h-screen flex items-center justify-center bg-white">
			<div className="flex flex-col items-center space-y-6">
				<div className="h-10 w-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin"></div>
				<span className="text-base text-gray-500 font-medium tracking-wide">
					Redirecting...
				</span>
			</div>
		</div>
	);
}
