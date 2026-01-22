import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService, type UpdateUserRequest } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

export const useUsers = () => {
	return useQuery({
		queryKey: ["admin", "users"],
		queryFn: adminService.getAllUsers,
	});
};

export const useUser = (id: string) => {
	return useQuery({
		queryKey: ["admin", "users", id],
		queryFn: () => adminService.getUserById(id),
		enabled: !!id,
	});
};

export const useCreateUser = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: adminService.createUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast({
				title: "User Created",
				description: "User has been created successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create user.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateUser = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
			adminService.updateUser(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "users", id] });
			toast({
				title: "User Updated",
				description: "User has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update user.",
				variant: "destructive",
			});
		},
	});
};

export const useDeleteUser = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: adminService.deleteUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast({
				title: "User Deleted",
				description: "User has been deleted successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Deletion Failed",
				description: error.message || "Failed to delete user.",
				variant: "destructive",
			});
		},
	});
};

export const useToggleUserStatus = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			adminService.toggleUserStatus(id, isActive),
		onSuccess: (_, { isActive }) => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
			toast({
				title: "Status Updated",
				description: `User has been ${isActive ? "activated" : "deactivated"} successfully.`,
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Status Update Failed",
				description: error.message || "Failed to update user status.",
				variant: "destructive",
			});
		},
	});
};
