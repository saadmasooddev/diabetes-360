import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { useCreateUser } from '@/hooks/mutations/useAdmin';
import { useSpecialtiesAdmin } from '@/hooks/mutations/usePhysician';
import { useUploadPhysicianImage } from '@/hooks/mutations/usePhysician';
import { useToast } from '@/hooks/use-toast';

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'admin', 'physician']),
  isActive: z.boolean(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  onClose: () => void;
}

export function CreateUserDialog({ onClose }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [physicianFields, setPhysicianFields] = useState({
    specialtyId: '',
    practiceStartDate: '',
    consultationFee: '',
    imageFile: null as File | null,
    imagePreview: '',
  });
  const createUserMutation = useCreateUser();
  const { data: specialties = [] } = useSpecialtiesAdmin();
  const uploadImageMutation = useUploadPhysicianImage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'customer',
      isActive: true,
    },
  });

  const watchedRole = watch('role');
  const watchedIsActive = watch('isActive');

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

  const onSubmit = async (data: CreateUserForm) => {
    setIsLoading(true);
    try {
      const userData: any = { ...data };

      // If physician role, include physician data
      if (data.role === 'physician') {
        let imageUrl = '';

        // Upload image if provided (upload before creating user)
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

        userData.physicianData = {
          specialtyId: physicianFields.specialtyId || specialties.find(s => s.name === 'General')?.id || '',
          practiceStartDate: physicianFields.practiceStartDate
            ? new Date(physicianFields.practiceStartDate).toISOString()
            : new Date().toISOString(),
          consultationFee: physicianFields.consultationFee || '0',
          imageUrl: imageUrl || null,
        };
      }

      await createUserMutation.mutateAsync(userData);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create user.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
        <DialogDescription>
          Create a new user account with the specified role and permissions.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="create-user-form">
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Enter password"
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

          {watchedRole === 'physician' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-900">Physician Information</h3>

              <div className="space-y-2">
                <Label htmlFor="specialtyId">Specialty *</Label>
                <Select
                  value={physicianFields.specialtyId}
                  onValueChange={(value) => setPhysicianFields({ ...physicianFields, specialtyId: value })}
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
                      toast({
                        title: 'Validation Failed',
                        description: 'Practice start date cannot be in the future',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setPhysicianFields({ ...physicianFields, practiceStartDate: selectedDate });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  required={watchedRole === 'physician'}
                />
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
                  required={watchedRole === 'physician'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="physicianImage">Profile Image</Label>
                <Input
                  id="physicianImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {physicianFields.imagePreview && (
                  <Image
                    src={physicianFields.imagePreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border"
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
          form="create-user-form"
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
