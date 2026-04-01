import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import type { LoginRequest, AuthData, User } from "@/types/auth.types";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useLocation } from "wouter";
import { userService } from "@/services/userService";
import { utils } from "@/lib/utils";
import type { UserRole } from "@shared/schema";
import { ROUTES } from "@/config/routes";

export const useRequestSignInCode = () => {
	const { toast } = useToast();
	const [, navigate] = useLocation()

	return useMutation({
		mutationFn: (email: string) => authService.requestSignInCode(email),
		onSuccess: (data) => {
			if(data?.emailVerificationCodeSent === true){
				navigate(`${ROUTES.VERIFY_EMAIL}?email=${data.user.email}`)
				return
			}
			toast({
				title: "Code sent",
				description: "Code sent to your email. It will expire in 5 minutes.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Could not send code",
				description: error.message || "Please try again or use your password.",
				variant: "destructive",
			});
		},
	});
};

export const useLogin = () => {
	const { toast } = useToast();
	const setAuth = useAuthStore((state) => state.setAuth);
	const [, navigate] = useLocation();

	return useMutation<AuthData, Error, LoginRequest>({
		mutationFn: (data) => authService.login(data),
		onSuccess: (data) => {
			if(data?.emailVerificationCodeSent === true){
				navigate(`${ROUTES.VERIFY_EMAIL}?email=${data.user.email}`)
				return
			}

			if (data.requiresTwoFactor) {
				return; // Let the component handle 2FA verification
			}

			setAuth(data.user as unknown as User, data.tokens!);
			toast({
				title: "Welcome back!",
				description: "You have successfully logged in.",
				variant: "default",
			});

			const role = data.user.role;
			utils.roleAfterAuthNavigationMap[role]?.(
				{ user: data.user, tokens: data.tokens },
				navigate,
			);
		},
		onError: (error) => {
			toast({
				title: "Login Failed",
				description: error.message || "Invalid credentials. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const useVerify2FALogin = () => {
	const { toast } = useToast();
	const setAuth = useAuthStore((state) => state.setAuth);
	const [, navigate] = useLocation();

	return useMutation<AuthData, Error, { email: string; token: string }>({
		mutationFn: ({ email, token }) => authService.verify2FALogin(email, token),
		onSuccess: (data) => {
			setAuth(data.user as unknown as User, data.tokens!);
			toast({
				title: "Welcome back!",
				description: "You have successfully logged in.",
				variant: "default",
			});

			const role: UserRole = data.user.role;
			utils.roleAfterAuthNavigationMap[role]?.(
				{ user: data.user, tokens: data.tokens },
				navigate,
			);
		},
		onError: (error) => {
			toast({
				title: "Verification Failed",
				description:
					error.message || "Invalid verification code. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const useUserProfile = () => {
	return useQuery({
		queryKey: ["user", "profile"],
		queryFn: () => userService.getUserProfile(),
	});
};
