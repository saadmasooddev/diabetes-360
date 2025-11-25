import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { usePhysicianLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/mutations/usePhysician';
import { GoogleMapsLocationPicker } from './GoogleMapsLocationPicker';
import { MapPin, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateLocationRequest, PhysicianLocation } from '@/services/physicianService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GOOGLE_MAPS_API_KEY } from '@/utils/env';

export function ManageLocation() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PhysicianLocation | null>(null);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);

  const { data: locations = [], isLoading } = usePhysicianLocations();
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();

  const handleLocationSelect = async (locationData: CreateLocationRequest) => {
    try {
      if (editingLocation) {
        await updateLocationMutation.mutateAsync({
          id: editingLocation.id,
          data: locationData,
        });
        setEditingLocation(null);
        setIsAddDialogOpen(false);
      } else {
        await createLocationMutation.mutateAsync(locationData);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (location: PhysicianLocation) => {
    setEditingLocation(location);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteLocationId) return;
    try {
      await deleteLocationMutation.mutateAsync(deleteLocationId);
      setDeleteLocationId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingLocation(null);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5 text-teal-600" />
                Manage Locations
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Add and manage your consultation locations
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No locations added yet</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                className="bg-teal-600 hover:bg-teal-700 text-white border-teal-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Location
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className={cn(
                    "border transition-all hover:shadow-md",
                    location.status === 'active' ? "border-teal-200 bg-teal-50/50" : "border-gray-200 bg-gray-50"
                  )}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">
                          {location.locationName}
                        </h3>
                        <Badge
                          variant={location.status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            "text-xs",
                            location.status === 'active' ? "bg-teal-600 text-white" : "bg-gray-400"
                          )}
                        >
                          {location.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          className="h-8 w-8 p-0 hover:bg-teal-50"
                        >
                          <Edit2 className="h-4 w-4 text-teal-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteLocationId(location.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {location.address && (
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-600" />
                          <span>{location.address}</span>
                        </p>
                        {(location.city || location.state || location.country) && (
                          <p className="ml-6">
                            {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    )}


                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Location Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingLocation
                ? 'Update your location details on the map'
                : 'Select a location on the map or search for an address'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <GoogleMapsLocationPicker
              apiKey={GOOGLE_MAPS_API_KEY}
              onLocationSelect={(locationData) => {
                handleLocationSelect({
                  ...locationData,
                  status: locationData.status || 'active',
                });
              }}
              initialLocation={editingLocation ? {
                locationName: editingLocation.locationName,
                address: editingLocation.address || undefined,
                city: editingLocation.city || undefined,
                state: editingLocation.state || undefined,
                country: editingLocation.country || undefined,
                postalCode: editingLocation.postalCode || undefined,
                latitude: editingLocation.latitude,
                longitude: editingLocation.longitude,
                status: editingLocation.status,
              } : null}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLocationId} onOpenChange={(open) => !open && setDeleteLocationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

