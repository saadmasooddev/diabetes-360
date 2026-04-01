import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import type { AuthData, KeycloakSsoLoginRequest, User } from "@/types/auth.types";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useLocation } from "wouter";
import { utils } from "@/lib/utils";
import { PROVIDERS, type UserRole } from "@shared/schema";
import { ROUTES } from "@/config/routes";

export const useKeycloakSsoLogin = () => {
	const { toast } = useToast();
	const setAuth = useAuthStore((state) => state.setAuth);
	const [, navigate] = useLocation();

	return useMutation({
		mutationFn: (data: { ssoAccessToken: string, ssoSubject: string}) =>
			authService.loginWithKeycloak({
				ssoProvider: PROVIDERS.KEYCLOAK,
				...data
			}),
		onSuccess: (data) => {
			if (data?.emailVerificationCodeSent === true) {
				toast({
					title: "Verify your email",
					description: "Complete email verification to continue.",
					variant: "default",
				});
				navigate(
					`${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(data.user.email)}`,
				);
				return;
			}
			setAuth(data.user as unknown as User, data.tokens!);
			toast({
				title: "Welcome back!",
				description: "You signed in with SSO successfully.",
				variant: "default",
			});
			const role = data.user.role as UserRole;
			utils.roleAfterAuthNavigationMap[role]?.(
				{ user: data.user, tokens: data.tokens },
				navigate,
			);
		},
		onError: (error) => {
			toast({
				title: "SSO sign-in failed",
				description:
					error.message ||
					"Could not complete single sign-on. Try again or use email.",
				variant: "destructive",
			});
		},
	});
};
