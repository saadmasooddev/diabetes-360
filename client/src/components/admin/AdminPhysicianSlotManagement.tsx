import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDatesWithAvailability, useSlotsForDate, useUpdateSlotPrice, useUpdateSlotLocations } from '@/hooks/mutations/useBooking';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, Edit2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slot } from '@/services/bookingService';
import { cn } from '@/lib/utils';

const formatDate = (date: Date, formatStr: string): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (formatStr === 'MMM dd, yyyy') {
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return date.toLocaleDateString();
};

const formatTime24 = (time: string): string => {
  if (!time) return '';
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
  return time;
};

interface AdminPhysicianSlotManagementProps {
  physicianId: string;
}

export function AdminPhysicianSlotManagement({ physicianId }: AdminPhysicianSlotManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingLocationSlotId, setEditingLocationSlotId] = useState<string | null>(null);
  const [editingLocationIds, setEditingLocationIds] = useState<string[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);

  const { data: datesWithAvailability = [] } = useDatesWithAvailability(physicianId);
  const { data: slots = [], refetch: refetchSlots } = useSlotsForDate(
    physicianId,
    selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null
  );

  const updatePriceMutation = useUpdateSlotPrice();
  const updateLocationMutation = useUpdateSlotLocations();

  const availableDates = datesWithAvailability.map((d) => {
    if (typeof d === 'string') {
      return new Date(d);
    }
    return new Date(d);
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      toast({
        title: 'Invalid Date',
        description: 'You can only select future dates.',
        variant: 'destructive',
      });
      return;
    }

    // Always set the date, even if it's the same, to allow reopening the modal
    setSelectedDate(date);
    setIsViewModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsViewModalOpen(open);
    if (!open) {
      setSelectedDate(undefined);
      // Force calendar re-render to allow same date selection
      setCalendarKey(prev => prev + 1);
    }
  };

  const handleEditPrice = (priceId: string, currentPrice: string) => {
    setEditingPriceId(priceId);
    setEditingPrice(currentPrice);
  };

  const handleSavePrice = async () => {
    if (!editingPriceId || !editingPrice) return;
    updatePriceMutation.mutate({
      priceId: editingPriceId,
      data: { price: editingPrice },
    });
    setEditingPriceId(null);
    setEditingPrice('');
    refetchSlots();
  };

  const handleEditLocations = (slot: Slot) => {
    setEditingLocationSlotId(slot.id);
    setEditingLocationIds(slot.locations?.map(loc => loc.id) || []);
  };

  const handleSaveLocations = async () => {
    if (!editingLocationSlotId) return;
    try {
      await updateLocationMutation.mutateAsync({
        slotId: editingLocationSlotId,
        data: { locationIds: editingLocationIds },
      });
      setEditingLocationSlotId(null);
      setEditingLocationIds([]);
      await refetchSlots();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-teal-600" />
          Physician Availability Management
        </CardTitle>
        <CardDescription>
          View and manage consultation slots for this physician
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Calendar
            key={crypto.randomUUID()}
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            modifiers={{
              hasAvailability: availableDates,
            }}
            modifiersClassNames={{
              hasAvailability: 'bg-teal-100 text-teal-900 font-semibold hover:bg-teal-200',
            }}
            className=" flex justify-center items-center rounded-md border w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-teal-900",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-teal-100 rounded-md text-teal-900 border border-teal-200"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-teal-700 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: " mx-1  h-9 w-9 text-center text-sm p-0 relative",
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-teal-50 rounded-md transition-colors"
              ),
              day_selected: "bg-teal-600 text-white hover:bg-teal-700 focus:bg-teal-700",
              day_today: "bg-teal-50 text-teal-900 font-semibold",
              day_disabled: "text-gray-300 opacity-50",
            }}
          />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-teal-100 rounded"></div>
            <span>Dates with availability</span>
          </div>
        </div>

        {/* View Slots Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <DialogTitle>Slots for {selectedDate ? formatDate(selectedDate, 'MMM dd, yyyy') : ''}</DialogTitle>
              <DialogDescription>
                View and manage consultation slots (Admin can edit prices for unbooked slots)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {slots.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No slots created for this date</p>
              ) : (
                slots.map((slot: Slot) => (
                  <AdminSlotCard
                    key={slot.id}
                    slot={slot}
                    onEditPrice={handleEditPrice}
                    editingPriceId={editingPriceId}
                    editingPrice={editingPrice}
                    onSavePrice={handleSavePrice}
                    onCancelEdit={() => {
                      setEditingPriceId(null);
                      setEditingPrice('');
                    }}
                    onEditLocations={handleEditLocations}
                    editingLocationSlotId={editingLocationSlotId}
                    editingLocationIds={editingLocationIds}
                    onLocationIdsChange={setEditingLocationIds}
                    onSaveLocations={handleSaveLocations}
                    onCancelLocationEdit={() => {
                      setEditingLocationSlotId(null);
                      setEditingLocationIds([]);
                    }}
                  />
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface AdminSlotCardProps {
  slot: Slot;
  onEditPrice: (priceId: string, currentPrice: string) => void;
  editingPriceId: string | null;
  editingPrice: string;
  onSavePrice: () => void;
  onCancelEdit: () => void;
  onEditLocations: (slot: Slot) => void;
  editingLocationSlotId: string | null;
  editingLocationIds: string[];
  onLocationIdsChange: (ids: string[]) => void;
  onSaveLocations: () => void;
  onCancelLocationEdit: () => void;
}

function AdminSlotCard({
  slot,
  onEditPrice,
  editingPriceId,
  editingPrice,
  onSavePrice,
  onCancelEdit,
  onEditLocations,
  editingLocationSlotId,
  editingLocationIds,
  onLocationIdsChange,
  onSaveLocations,
  onCancelLocationEdit,
}: AdminSlotCardProps) {
  const isBooked = slot.isBooked;
  const isEditingLocations = editingLocationSlotId === slot.id;

  // Check if slot has offline/onsite type
  const hasOfflineType = slot.types?.some(
    type => type.type.toLowerCase() === 'onsite' || type.type.toLowerCase() === 'offline'
  );

  // For admin, we'll use locations from slot data
  // In a real scenario, you might want to fetch all locations for this physician
  const availableLocations = slot.locations || [];

  const handleStartEdit = (priceId: string, currentPrice: string) => {
    onEditPrice(priceId, currentPrice);
  };

  const handleSave = () => {
    if (editingPriceId && editingPrice) {
      onSavePrice();
    }
  };

  const handleCancel = () => {
    onCancelEdit();
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-2 transition-all",
      isBooked
        ? "bg-orange-50 border-orange-200 shadow-sm"
        : "bg-white border-gray-200 hover:border-teal-300"
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className={cn("font-medium", isBooked ? "text-orange-900" : "text-gray-900")}>
            {formatTime24(slot.startTime)} - {formatTime24(slot.endTime)}
          </p>
          <p className={cn("text-sm", isBooked ? "text-orange-700" : "text-gray-600")}>
            {slot.slotSize?.size} minutes • {slot.types?.map((t: any) => t.type).join(', ')}
          </p>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {slot.prices?.map((price) => (
          <div key={price.id} className={cn(
            "flex items-center justify-between p-2 rounded",
            isBooked ? "bg-orange-100" : "bg-gray-50"
          )}>
            <span className={cn("text-sm font-medium", isBooked ? "text-orange-900" : "text-gray-900")}>
              {price.slotType?.type}: PKR {parseFloat(price.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {!slot.isBooked && (
              <div className="flex items-center gap-2">
                {editingPriceId === price.id ? (
                  <>
                    <Input
                      type="number"
                      value={editingPrice}
                      onChange={(e) => onEditPrice(price.id, e.target.value)}
                      className="w-24 h-8"
                      min="0"
                      step="0.01"
                    />
                    <Button size="sm" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">Save</Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(price.id, price.price)}
                    className="hover:bg-teal-50"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Locations Section */}
      {hasOfflineType && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Locations
            </Label>
            {!slot.isBooked && !isEditingLocations && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditLocations(slot)}
                className="hover:bg-teal-50"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {isEditingLocations ? (
            <div className="space-y-2">
              {availableLocations.length === 0 ? (
                <p className="text-sm text-yellow-600">No locations available for editing</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableLocations.map((location) => (
                    <div key={location.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`admin-edit-loc-${location.id}`}
                        checked={editingLocationIds.includes(location.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onLocationIdsChange([...editingLocationIds, location.id]);
                          } else {
                            onLocationIdsChange(editingLocationIds.filter(id => id !== location.id));
                          }
                        }}
                      />
                      <Label htmlFor={`admin-edit-loc-${location.id}`} className="flex-1 cursor-pointer text-sm">
                        <div className="font-medium">{location.locationName}</div>
                        {location.address && (
                          <div className="text-xs text-gray-600">{location.address}</div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onSaveLocations}
                  disabled={editingLocationIds.length === 0}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelLocationEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {slot.locations && slot.locations.length > 0 ? (
                slot.locations.map((location) => (
                  <div key={location.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="font-medium">{location.locationName}</div>
                    {location.address && (
                      <div className="text-xs text-gray-600">{location.address}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No locations assigned</p>
              )}
            </div>
          )}
        </div>
      )}

      {slot.isBooked && (
        <p className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block">
          Booked
        </p>
      )}
    </div>
  );
}
