import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { TokenManager } from "@/utils/tokenManager";

export const useLogout = () => {
	const { toast } = useToast();
	const logout = useAuthStore((state) => state.logout);
	const [, navigate] = useLocation();
	const queryClient = useQueryClient()

	return useMutation<void, Error, void>({
		mutationFn: async () => {
			const refreshToken = TokenManager.getRefreshToken();
			if (refreshToken) {
				await authService.logout({ refreshToken });
			}
		},
		onSuccess: () => {
			logout();
			queryClient.clear()
			toast({
				title: "Logged out",
				description: "You have been successfully logged out.",
				variant: "default",
			});
			navigate(ROUTES.HOME);
		},
		onError: () => {
			logout();
			toast({
				title: "Logged out",
				description: "You have been logged out.",
				variant: "default",
			});
			navigate(ROUTES.HOME);
		},
	});
};
