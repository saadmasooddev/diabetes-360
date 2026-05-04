import { useMutation, useQuery } from "@tanstack/react-query";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/stores/authStore";
import { ProfileDataFormValues } from "@shared/schema";

export const useGetCustomerData = () => {
	return useQuery({
		queryKey: ["customerData"],
		queryFn: () => customerService.getCustomerData(),
		retry: false,
		// Don't throw error if customer data doesn't exist (for users without complete profiles)
		throwOnError: false,
	});
};

export const useCreateCustomerData = () => {
	const { toast } = useToast();
	const [, navigate] = useLocation();
	const { user, setUser } = useAuthStore();

	return useMutation({
		mutationFn: (data: ProfileDataFormValues) =>
			customerService.createCustomerData(data),
		onSuccess: () => {
			// Update user profile complete status
			if (user) {
				setUser({ ...user, profileComplete: true });
			}

			toast({
				title: "Profile Completed",
				description: "Your profile has been completed successfully.",
				variant: "default",
			});

			navigate(ROUTES.DASHBOARD);
		},
		onError: (error: any) => {
			toast({
				title: "Profile Creation Failed",
				description:
					error.response?.data?.message ||
					"Failed to complete profile. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateCustomerData = () => {
	const { toast } = useToast();

	return useMutation({
		mutationFn: (data: Partial<ProfileDataFormValues>) =>
			customerService.updateCustomerData(data),
		onSuccess: () => {
			toast({
				title: "Profile Updated",
				description: "Your profile has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Update Failed",
				description:
					error.response?.data?.message ||
					"Failed to update profile. Please try again.",
				variant: "destructive",
			});
		},
	});
};

export const getConsultationQuotasKey = () => ["consultationQuotas"];
export const useGetConsultationQuotas = () => {
	return useQuery({
		queryKey: getConsultationQuotasKey(),
		queryFn: () => customerService.getConsultationQuotas(),
	});
};
