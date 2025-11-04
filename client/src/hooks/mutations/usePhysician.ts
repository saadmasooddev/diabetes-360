import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { physicianService, type CreateSpecialtyRequest, type UpdateSpecialtyRequest, type CreatePhysicianDataRequest, type UpdatePhysicianDataRequest, type CreateRatingRequest } from '@/services/physicianService';
import { useToast } from '@/hooks/use-toast';

// Public consultation hooks
export const useSpecialties = () => {
  return useQuery({
    queryKey: ['physician', 'specialties'],
    queryFn: () => physicianService.getSpecialties(),
  });
};

export const usePhysiciansBySpecialty = (specialtyId: string | null) => {
  return useQuery({
    queryKey: ['physician', 'specialties', specialtyId, 'physicians'],
    queryFn: () => physicianService.getPhysiciansBySpecialty(specialtyId!),
    enabled: !!specialtyId,
  });
};

export const usePhysicianRating = (physicianId: string | null) => {
  return useQuery({
    queryKey: ['physician', 'ratings', physicianId],
    queryFn: () => physicianService.getPhysicianRating(physicianId!),
    enabled: !!physicianId,
  });
};

export const useCreateRating = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRatingRequest) => physicianService.createRating(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physician', 'ratings', variables.physicianId] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'specialties'] });
      toast({
        title: 'Rating Submitted',
        description: 'Your rating has been submitted successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Rating Failed',
        description: error.message || 'Failed to submit rating.',
        variant: 'destructive',
      });
    },
  });
};

// Admin hooks
export const useSpecialtiesAdmin = () => {
  return useQuery({
    queryKey: ['physician', 'admin', 'specialties'],
    queryFn: () => physicianService.getAllSpecialtiesAdmin(),
  });
};

export const useSpecialtyAdmin = (id: string | null) => {
  return useQuery({
    queryKey: ['physician', 'admin', 'specialties', id],
    queryFn: () => physicianService.getSpecialtyById(id!),
    enabled: !!id,
  });
};

export const useCreateSpecialty = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpecialtyRequest) => physicianService.createSpecialty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'specialties'] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'specialties'] });
      toast({
        title: 'Specialty Created',
        description: 'Specialty has been created successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create specialty.',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'specialties'] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'specialties', id] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'specialties'] });
      toast({
        title: 'Specialty Updated',
        description: 'Specialty has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update specialty.',
        variant: 'destructive',
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
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'specialties'] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'specialties'] });
      toast({
        title: 'Specialty Deleted',
        description: 'Specialty has been deleted successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete specialty.',
        variant: 'destructive',
      });
    },
  });
};

export const usePhysicianData = (userId: string | null) => {
  return useQuery({
    queryKey: ['physician', 'admin', 'physician-data', userId],
    queryFn: () => physicianService.getPhysicianData(userId!),
    enabled: !!userId,
  });
};

export const useCreatePhysicianData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePhysicianDataRequest) => physicianService.createPhysicianData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'physician-data'] });
      toast({
        title: 'Physician Data Created',
        description: 'Physician data has been created successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create physician data.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePhysicianData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdatePhysicianDataRequest }) =>
      physicianService.updatePhysicianData(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'physician-data'] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'physician-data', userId] });
      queryClient.invalidateQueries({ queryKey: ['physician', 'specialties'] });
      toast({
        title: 'Physician Data Updated',
        description: 'Physician data has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update physician data.',
        variant: 'destructive',
      });
    },
  });
};

export const useUploadPhysicianImage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => physicianService.uploadImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physician', 'admin', 'physician-data'] });
      toast({
        title: 'Image Uploaded',
        description: 'Image has been uploaded successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image.',
        variant: 'destructive',
      });
    },
  });
};

