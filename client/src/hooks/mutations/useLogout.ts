import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { TokenManager } from "@/utils/tokenManager";
import {
	clearFcmRegistration,
	readFcmRegistration,
} from "@/lib/fcm/fcmTokenStorage";

export const useLogout = () => {
	const { toast } = useToast();
	const logout = useAuthStore((state) => state.logout);
	const [, navigate] = useLocation();
	const queryClient = useQueryClient();

	return useMutation<void, Error, void>({
		mutationFn: async () => {
			const refreshToken = TokenManager.getRefreshToken();
			const fcm = readFcmRegistration();
			if (refreshToken) {
				await authService.logout({
					refreshToken,
					fcmToken: fcm?.token,
					deviceType: fcm?.deviceType,
				});
			}
			clearFcmRegistration();
		},
		onSuccess: () => {
			logout();
			queryClient.clear();
			toast({
				title: "Logged out",
				description: "You have been successfully logged out.",
				variant: "default",
			});
			navigate(ROUTES.LOGIN , { replace: true });
		},
		onError: () => {
			toast({
				title: "Logout Failed",
				description: "Failed to log out. Please try again.",
				variant: "default",
			});
		},
	});
};
