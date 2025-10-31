import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeleteUser } from '@/hooks/mutations/useAdmin';

interface DeleteUserDialogProps {
  userId: string;
  onClose: () => void;
}

export function DeleteUserDialog({ userId, onClose }: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const deleteUserMutation = useDeleteUser();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteUserMutation.mutateAsync(userId);
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}