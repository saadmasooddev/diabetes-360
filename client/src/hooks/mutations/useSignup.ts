import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import type { SignupRequest } from "@/types/auth.types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";

export const useSignup = () => {
	const { toast } = useToast();
	const [, navigate] = useLocation();

	return useMutation<
		{ otpSent: boolean },
		Error,
		SignupRequest
	>({
		mutationFn: authService.signup,
		onSuccess: (data, variables) => {
			if (data.otpSent) {
				toast({
					title: "Check your email",
					description: "We sent a verification code. Enter it on the next page.",
					variant: "default",
				});
				const params = new URLSearchParams({ email: variables.email });
				navigate(`${ROUTES.VERIFY_EMAIL}?${params.toString()}`);
			} else {
				toast({
					title: "Code not sent",
					description:
						"Your account was created but we couldn't send the verification email. Click Sign up again to resend.",
					variant: "destructive",
				});
			}
		},
		onError: (error) => {
			toast({
				title: "Signup Failed",
				description:
					error.message || "Something went wrong. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const useVerifyEmail = () => {
	const { toast } = useToast();
	const [, navigate] = useLocation();

	return useMutation<string, Error, { email: string; code: string }>({
		mutationFn: ({ email, code }) => authService.verifyEmail(email, code),
		onSuccess: () => {
			toast({
				title: "Email verified",
				description: "You can now sign in to your account.",
				variant: "default",
			});
			navigate(ROUTES.LOGIN);
		},
		onError: (error) => {
			toast({
				title: "Verification failed",
				description: error.message || "Invalid or expired code. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const useResendVerificationOtp = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: (email: string) => authService.resendVerificationOtp(email),
		onSuccess: (data) => {
			if (data.otpSent) {
				toast({
					title: "Code sent",
					description: "Check your email for the new verification code.",
					variant: "default",
				});
			} else {
				toast({
					title: "Could not send code",
					description: "Please try again later.",
					variant: "destructive",
				});
			}
		},
		onError: (error) => {
			toast({
				title: "Resend failed",
				description: error.message || "Please try again.",
				variant: "destructive",
			});
		},
	});
};
