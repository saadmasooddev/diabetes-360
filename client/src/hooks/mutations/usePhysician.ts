import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	physicianService,
	type CreateSpecialtyRequest,
	type UpdateSpecialtyRequest,
	type CreatePhysicianDataRequest,
	type UpdatePhysicianDataRequest,
	type CreateRatingRequest,
	type CreateLocationRequest,
	type UpdateLocationRequest,
} from "@/services/physicianService";
import { useToast } from "@/hooks/use-toast";

// Public consultation hooks
export const useSpecialties = () => {
	return useQuery({
		queryKey: ["physician", "specialties"],
		queryFn: () => physicianService.getSpecialties(),
	});
};

export const useAllPhysicians = () => {
	return useQuery({
		queryKey: ["physician", "all-physicians"],
		queryFn: () => physicianService.getAllPhysicians(),
	});
};

export const usePhysiciansBySpecialty = (specialtyId: string | null) => {
	return useQuery({
		queryKey: ["physician", "specialties", specialtyId, "physicians"],
		queryFn: () => physicianService.getPhysiciansBySpecialty(specialtyId!),
		enabled: !!specialtyId,
	});
};

export const usePhysiciansPaginated = (params: {
	page: number;
	limit: number;
	search?: string;
	specialtyId?: string | null;
}) => {
	return useQuery({
		queryKey: [
			"physician",
			"paginated",
			params.page,
			params.limit,
			params.search,
			params.specialtyId,
		],
		queryFn: () =>
			physicianService.getPhysiciansPaginated({
				...params,
				specialtyId: params.specialtyId || undefined,
			}),
		placeholderData: (previousData) => previousData,
	});
};

export const usePhysicianRating = (physicianId: string | null) => {
	return useQuery({
		queryKey: ["physician", "ratings", physicianId],
		queryFn: () => physicianService.getPhysicianRating(physicianId!),
		enabled: !!physicianId,
	});
};

export const useCreateRating = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateRatingRequest) =>
			physicianService.createRating(data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "ratings", variables.physicianId],
			});
			queryClient.invalidateQueries({ queryKey: ["physician", "specialties"] });
			toast({
				title: "Rating Submitted",
				description: "Your rating has been submitted successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Rating Failed",
				description: error.message || "Failed to submit rating.",
				variant: "destructive",
			});
		},
	});
};

// Admin hooks
export const useSpecialtiesAdmin = () => {
	return useQuery({
		queryKey: ["physician", "admin", "specialties"],
		queryFn: () => physicianService.getAllSpecialtiesAdmin(),
	});
};

export const useSpecialtyAdmin = (id: string | null) => {
	return useQuery({
		queryKey: ["physician", "admin", "specialties", id],
		queryFn: () => physicianService.getSpecialtyById(id!),
		enabled: !!id,
	});
};

export const useCreateSpecialty = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateSpecialtyRequest) =>
			physicianService.createSpecialty(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "specialties"],
			});
			queryClient.invalidateQueries({ queryKey: ["physician", "specialties"] });
			toast({
				title: "Specialty Created",
				description: "Specialty has been created successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create specialty.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateSpecialty = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateSpecialtyRequest }) =>
			physicianService.updateSpecialty(id, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "specialties"],
			});
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "specialties", id],
			});
			queryClient.invalidateQueries({ queryKey: ["physician", "specialties"] });
			toast({
				title: "Specialty Updated",
				description: "Specialty has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update specialty.",
				variant: "destructive",
			});
		},
	});
};

export const useDeleteSpecialty = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => physicianService.deleteSpecialty(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "specialties"],
			});
			queryClient.invalidateQueries({ queryKey: ["physician", "specialties"] });
			toast({
				title: "Specialty Deleted",
				description: "Specialty has been deleted successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Deletion Failed",
				description: error.message || "Failed to delete specialty.",
				variant: "destructive",
			});
		},
	});
};

export const usePhysicianData = (userId: string | null) => {
	return useQuery({
		queryKey: ["physician", "admin", "physician-data", userId],
		queryFn: () => physicianService.getPhysicianData(userId!),
		enabled: !!userId,
	});
};

export const useCreatePhysicianData = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreatePhysicianDataRequest) =>
			physicianService.createPhysicianData(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "physician-data"],
			});
			toast({
				title: "Physician Data Created",
				description: "Physician data has been created successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create physician data.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdatePhysicianData = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			data,
		}: {
			userId: string;
			data: UpdatePhysicianDataRequest;
		}) => physicianService.updatePhysicianData(userId, data),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "physician-data"],
			});
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "physician-data", userId],
			});
			queryClient.invalidateQueries({ queryKey: ["physician", "specialties"] });
			toast({
				title: "Physician Data Updated",
				description: "Physician data has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update physician data.",
				variant: "destructive",
			});
		},
	});
};

export const useUploadPhysicianImage = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			file,
		}: {
			userId: string;
			file: File;
		}) => physicianService.uploadPhysicianProfileImage(userId, file),
		onSuccess: (_, { userId }) => {
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "physician-data"],
			});
			queryClient.invalidateQueries({
				queryKey: ["physician", "admin", "physician-data", userId],
			});
			toast({
				title: "Image Uploaded",
				description: "Profile image has been saved to storage.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Upload Failed",
				description: error.message || "Failed to upload image.",
				variant: "destructive",
			});
		},
	});
};

// Location hooks
export const usePhysicianLocations = () => {
	return useQuery({
		queryKey: ["physician", "locations"],
		queryFn: () => physicianService.getAllLocations(),
	});
};

// Admin hook to get locations for a specific physician
export const usePhysicianLocationsByPhysicianId = (
	physicianId: string | null,
) => {
	return useQuery({
		queryKey: ["physician", "admin", "locations", physicianId],
		queryFn: () => physicianService.getAllLocationsByPhysicianId(physicianId!),
		enabled: !!physicianId,
	});
};

export const useCreateLocation = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateLocationRequest) =>
			physicianService.createLocation(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["physician", "locations"] });
			toast({
				title: "Location Added",
				description: "Location has been added successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Failed to Add Location",
				description: error.message || "Failed to add location.",
				variant: "destructive",
			});
		},
	});
};

export const useUpdateLocation = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateLocationRequest }) =>
			physicianService.updateLocation(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["physician", "locations"] });
			toast({
				title: "Location Updated",
				description: "Location has been updated successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update location.",
				variant: "destructive",
			});
		},
	});
};

export const useDeleteLocation = () => {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => physicianService.deleteLocation(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["physician", "locations"] });
			toast({
				title: "Location Deleted",
				description: "Location has been deleted successfully.",
				variant: "default",
			});
		},
		onError: (error) => {
			toast({
				title: "Deletion Failed",
				description: error.message || "Failed to delete location.",
				variant: "destructive",
			});
		},
	});
};
