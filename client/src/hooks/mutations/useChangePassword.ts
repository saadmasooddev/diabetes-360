import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export const useChangePassword = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: ({
			oldPassword,
			newPassword,
		}: {
			oldPassword: string;
			newPassword: string;
		}) => authService.changePassword(oldPassword, newPassword),
		onSuccess: () => {
			toast({
				title: "Password Changed",
				description: "Your password has been changed successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Password Change Failed",
				description:
					error.message || "Failed to change password. Please try again.",
				variant: "destructive",
			});
		},
	});
};
