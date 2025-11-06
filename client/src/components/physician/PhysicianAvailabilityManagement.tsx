import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSlotSizes, useSlotTypes, useDatesWithAvailability, useSlotsForDate, useCreateSlots, useDeleteSlot, useUpdateSlotPrice } from '@/hooks/mutations/useBooking';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, Plus, Trash2, Edit2 } from 'lucide-react';
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

// Format time to 24-hour format
const formatTime24 = (time: string): string => {
  if (!time) return '';
  // If already in HH:MM format, return as is
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  // If in HH:MM:SS format, return HH:MM
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
  return time;
};

export function PhysicianAvailabilityManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const { data: slotSizes = [] } = useSlotSizes();
  const { data: slotTypes = [] } = useSlotTypes();
  const { data: datesWithAvailability = [] } = useDatesWithAvailability(user?.id || null);
  const { data: slots = [], refetch: refetchSlots } = useSlotsForDate(
    user?.id || null,
    selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null
  );

  const createSlotsMutation = useCreateSlots();
  const deleteSlotMutation = useDeleteSlot();
  const updatePriceMutation = useUpdateSlotPrice();

  // Convert date strings to Date objects for calendar
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

    setSelectedDate(date);
    setIsViewModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsViewModalOpen(open);
    if (!open) {
      // Reset selected date when modal closes to allow reopening
      setSelectedDate(undefined);
    }
  };

  const handleCreateSlots = async (data: {
    slotSizeId: string;
    startTime: string;
    endTime: string;
    slotTypeIds: string[];
    prices: Array<{ slotTypeId: string; price: string }>;
  }) => {
    if (!selectedDate) return;

    try {
      await createSlotsMutation.mutateAsync({
        date: selectedDate.toISOString(),
        ...data,
      });
      setIsCreateModalOpen(false);
      // Refetch slots and dates with availability
      await refetchSlots();
      // Invalidate dates query to refresh calendar
      queryClient.invalidateQueries({ queryKey: ['booking', 'dates-with-availability', user?.id] });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlotMutation.mutateAsync(slotId);
      await refetchSlots();
      queryClient.invalidateQueries({ queryKey: ['booking', 'dates-with-availability', user?.id] });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditPrice = (priceId: string, currentPrice: string) => {
    setEditingPriceId(priceId);
    setEditingPrice(currentPrice);
  };

  const handleSavePrice = async () => {
    if (!editingPriceId || !editingPrice) return;
    console.log("the difference is", editingPriceId, editingPrice, "ola ola");

    console.log("The data is", { priceId: editingPriceId, data: { price: editingPrice } });
    updatePriceMutation.mutate({
      priceId: editingPriceId,
      data: { price: editingPrice },
    });
    setEditingPriceId(null);
    setEditingPrice('');
    refetchSlots();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
          Consultation Availability
        </CardTitle>
        <CardDescription className="text-sm">
          Manage your consultation dates and time slots
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          <Calendar
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
          {selectedDate && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Slots for {formatDate(selectedDate, 'MMM dd, yyyy')}
            </Button>
          )}
        </div>

        {/* Create Slots Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <DialogTitle className="text-lg sm:text-xl">Create Time Slots</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Add consultation slots for {selectedDate ? formatDate(selectedDate, 'MMM dd, yyyy') : ''}
              </DialogDescription>
            </DialogHeader>
            <CreateSlotsForm
              slotSizes={slotSizes}
              slotTypes={slotTypes}
              onSubmit={handleCreateSlots}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={createSlotsMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* View Slots Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <DialogTitle className="text-lg sm:text-xl">Slots for {selectedDate ? formatDate(selectedDate, 'MMM dd, yyyy') : ''}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                View and manage your consultation slots
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 pt-2">
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add More Slots
                </Button>
                <div className="space-y-3">
                  {slots.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No slots created for this date</p>
                  ) : (
                    slots.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onDelete={handleDeleteSlot}
                        onEditPrice={handleEditPrice}
                        editingPriceId={editingPriceId}
                        editingPrice={editingPrice}
                        onSavePrice={handleSavePrice}
                        onCancelEdit={() => {
                          setEditingPriceId(null);
                          setEditingPrice('');
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface CreateSlotsFormProps {
  slotSizes: Array<{ id: string; size: number }>;
  slotTypes: Array<{ id: string; type: string }>;
  onSubmit: (data: {
    slotSizeId: string;
    startTime: string;
    endTime: string;
    slotTypeIds: string[];
    prices: Array<{ slotTypeId: string; price: string }>;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CreateSlotsForm({ slotSizes, slotTypes, onSubmit, onCancel, isLoading }: CreateSlotsFormProps) {
  const [slotSizeId, setSlotSizeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const selectedSlotSize = slotSizes.find((s) => s.id === slotSizeId);
  const totalSlots = selectedSlotSize && startTime && endTime
    ? calculateSlots(startTime, endTime, selectedSlotSize.size)
    : 0;

  const handleTypeToggle = (typeId: string) => {
    if (selectedTypeIds.includes(typeId)) {
      setSelectedTypeIds(selectedTypeIds.filter((id) => id !== typeId));
      const newPrices = { ...prices };
      delete newPrices[typeId];
      setPrices(newPrices);
    } else {
      setSelectedTypeIds([...selectedTypeIds, typeId]);
      setPrices({ ...prices, [typeId]: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSizeId || !startTime || !endTime || selectedTypeIds.length === 0) {
      return;
    }

    const pricesArray = selectedTypeIds.map((typeId) => ({
      slotTypeId: typeId,
      price: prices[typeId] || '0',
    }));

    onSubmit({
      slotSizeId,
      startTime,
      endTime,
      slotTypeIds: selectedTypeIds,
      prices: pricesArray,
    });
  };

  const getValidEndTimes = () => {
    if (!selectedSlotSize || !startTime) return [];
    const startMinutes = timeToMinutes(startTime);
    const validTimes: string[] = [];
    for (let i = selectedSlotSize.size; i <= 24 * 60; i += selectedSlotSize.size) {
      const endMinutes = startMinutes + i;
      if (endMinutes > 24 * 60) break;
      validTimes.push(minutesToTime(endMinutes));
    }
    return validTimes;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-4">
      <div className="space-y-2">
        <Label>Slot Size (minutes)</Label>
        <Select value={slotSizeId} onValueChange={setSlotSizeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select slot size" />
          </SelectTrigger>
          <SelectContent>
            {slotSizes.map((size) => (
              <SelectItem key={size.id} value={size.id}>
                {size.size} minutes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Start Time (24-hour format)</Label>
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>End Time (24-hour format)</Label>
        <Select
          value={endTime}
          onValueChange={setEndTime}
          disabled={!startTime || !selectedSlotSize}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select end time" />
          </SelectTrigger>
          <SelectContent>
            {getValidEndTimes().map((time) => (
              <SelectItem key={time} value={time}>
                {formatTime24(time)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {totalSlots > 0 && (
          <p className="text-sm text-gray-600">
            This will create {totalSlots} slot(s)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Consultation Types</Label>
        <div className="space-y-2">
          {slotTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={type.id}
                checked={selectedTypeIds.includes(type.id)}
                onChange={() => handleTypeToggle(type.id)}
                className="rounded"
              />
              <Label htmlFor={type.id} className="flex-1">
                {type.type}
              </Label>
              {selectedTypeIds.includes(type.id) && (
                <Input
                  type="number"
                  placeholder="Price"
                  value={prices[type.id] || ''}
                  onChange={(e) => setPrices({ ...prices, [type.id]: e.target.value })}
                  className="w-full sm:w-32"
                  min="0"
                  step="0.01"
                  required
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !slotSizeId || !startTime || !endTime || selectedTypeIds.length === 0}
          className="flex-1 bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? 'Creating...' : 'Create Slots'}
        </Button>
      </div>
    </form>
  );
}

interface SlotCardProps {
  slot: Slot;
  onDelete: (slotId: string) => void;
  onEditPrice: (priceId: string, currentPrice: string) => void;
  editingPriceId: string | null;
  editingPrice: string;
  onSavePrice: () => void;
  onCancelEdit: () => void;
}

function SlotCard({
  slot,
  onDelete,
  onEditPrice,
  editingPriceId,
  editingPrice,
  onSavePrice,
  onCancelEdit,
}: SlotCardProps) {
  const canDelete = !slot.isBooked;
  const isBooked = slot.isBooked;

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
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(slot.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
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
      {slot.isBooked && (
        <p className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded inline-block">
          Booked
        </p>
      )}
    </div>
  );
}

function calculateSlots(startTime: string, endTime: string, slotSizeMinutes: number): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start >= end) return 0;
  return Math.floor((end - start) / slotSizeMinutes);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}
