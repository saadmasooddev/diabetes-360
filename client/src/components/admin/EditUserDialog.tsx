import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { useUpdateUser } from '@/hooks/mutations/useAdmin';
import { useSpecialtiesAdmin, usePhysicianData, useUploadPhysicianImage } from '@/hooks/mutations/usePhysician';
import { type User } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  role: z.enum(['customer', 'admin', 'physician']),
  isActive: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [physicianFields, setPhysicianFields] = useState({
    specialtyId: '',
    practiceStartDate: '',
    consultationFee: '',
    imageFile: null as File | null,
    imagePreview: '',
    imageUrl: '',
  });
  const updateUserMutation = useUpdateUser();
  const { data: specialties = [] } = useSpecialtiesAdmin();
  const uploadImageMutation = useUploadPhysicianImage();

  // Fetch physician data if user is a physician
  const { data: physicianData } = usePhysicianData(user.role === 'physician' ? user.id : null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: user.fullName || '',
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });

  const watchedRole = watch('role');
  const watchedIsActive = watch('isActive');

  // Load physician data when available
  useEffect(() => {
    if (physicianData && user.role === 'physician') {
      const startDate = new Date(physicianData.practiceStartDate);
      const formattedDate = startDate.toISOString().split('T')[0];
      setPhysicianFields({
        specialtyId: physicianData.specialtyId,
        practiceStartDate: formattedDate,
        consultationFee: physicianData.consultationFee,
        imageFile: null,
        imagePreview: '',
        imageUrl: physicianData.imageUrl || '',
      });
    }
  }, [physicianData, user.role]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhysicianFields({ ...physicianFields, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhysicianFields({ ...physicianFields, imageFile: file, imagePreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const onSubmit = async (data: UpdateUserForm) => {
    setIsLoading(true);
    try {
      // Remove password from data if it's empty
      const updateData: any = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }

      if (data.role === 'physician' || user.role === 'physician') {
        let imageUrl = physicianFields.imageUrl;

        // Upload new image if provided
        if (physicianFields.imageFile) {
          imageUrl = await uploadImageMutation.mutateAsync(physicianFields.imageFile);
        }

        // Validate practice start date is not in the future
        if (physicianFields.practiceStartDate) {
          const practiceDate = new Date(physicianFields.practiceStartDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (practiceDate > today) {
            throw new Error('Practice start date cannot be in the future');
          }
        }

        updateData.physicianData = {
          specialtyId: physicianFields.specialtyId || (user.role === 'physician' && physicianData?.specialtyId) || '',
          practiceStartDate: physicianFields.practiceStartDate
            ? new Date(physicianFields.practiceStartDate).toISOString()
            : (user.role === 'physician' && physicianData?.practiceStartDate
              ? new Date(physicianData.practiceStartDate).toISOString()
              : new Date().toISOString()),
          consultationFee: physicianFields.consultationFee || (user.role === 'physician' && physicianData?.consultationFee) || '0',
          imageUrl: imageUrl || null,
        };
      }

      await updateUserMutation.mutateAsync({ id: user.id, data: updateData });
      onClose();
    } catch (error: any) {
      // Error is handled by the mutation hook or show validation error
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="edit-user-form">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Enter full name"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Leave blank to keep current password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={watchedRole} onValueChange={(value) => setValue('role', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="physician">Physician</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="isActive">Active Account</Label>
            </div>

            {(watchedRole === 'physician' || user.role === 'physician') && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Physician Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="specialtyId">Specialty *</Label>
                  <Select
                    value={physicianFields.specialtyId}
                    onValueChange={(value) => setPhysicianFields({ ...physicianFields, specialtyId: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!physicianFields.specialtyId && (watchedRole === 'physician' || user.role === 'physician') && (
                    <p className="text-sm text-red-600">Specialty is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="practiceStartDate">Practice Start Date *</Label>
                  <Input
                    id="practiceStartDate"
                    type="date"
                    value={physicianFields.practiceStartDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dateObj = new Date(selectedDate);

                      if (dateObj > today) {
                        alert('Practice start date cannot be in the future');
                        return;
                      }
                      setPhysicianFields({ ...physicianFields, practiceStartDate: selectedDate });
                    }}
                    max={getMaxDate()}
                    required={(watchedRole === 'physician' || user.role === 'physician')}
                    disabled={isLoading}
                  />
                  {!physicianFields.practiceStartDate && (watchedRole === 'physician' || user.role === 'physician') && (
                    <p className="text-sm text-red-600">Practice start date is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Consultation Fee (PKR) *</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={physicianFields.consultationFee}
                    onChange={(e) => setPhysicianFields({ ...physicianFields, consultationFee: e.target.value })}
                    placeholder="0.00"
                    required={(watchedRole === 'physician' || user.role === 'physician')}
                    disabled={isLoading}
                  />
                  {!physicianFields.consultationFee && (watchedRole === 'physician' || user.role === 'physician') && (
                    <p className="text-sm text-red-600">Consultation fee is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicianImage">Profile Image</Label>
                  <Input
                    id="physicianImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                  {(physicianFields.imagePreview || physicianFields.imageUrl) && (
                    <Image
                      src={physicianFields.imagePreview || physicianFields.imageUrl}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border"
                      pointToServer={!!physicianFields.imageUrl && !physicianFields.imagePreview}
                    />
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? 'Updating...' : 'Update User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
