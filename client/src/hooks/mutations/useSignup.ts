import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import type { SignupRequest, AuthData } from "@/types/auth.types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";

export const useSignup = () => {
	const { toast } = useToast();
	const [, navigate] = useLocation()

	return useMutation<AuthData, Error, SignupRequest>({
		mutationFn: authService.signup,
		onSuccess: (data) => {
			toast({
				title: "Success!",
				description: "Your account has been created successfully. Please check your email for your login credentials.",
				variant: "default",
			});
			navigate(ROUTES.LOGIN)
		},
		onError: (error) => {
			toast({
				title: "Signup Failed",
				description: error.message || "Something went wrong. Please try again.",
				variant: "destructive",
			});
		},
	});
};
