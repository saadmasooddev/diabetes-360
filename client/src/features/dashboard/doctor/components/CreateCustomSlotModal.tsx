import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, X } from "lucide-react";
import { formatDate, convert12To24Hour, DateManager } from "@/lib/utils";
import { useSlotTypes } from "@/hooks/mutations/useBooking";
import { usePhysicianLocations, usePhysicianLocationsByPhysicianId } from "@/hooks/mutations/usePhysician";
import { usePhysiciansPaginated } from "@/hooks/mutations/usePhysician";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import { useDebounce } from "@/hooks/useDebounce";
import type { Physician } from "@/services/physicianService";
import type { SlotType } from "@/services/bookingService";

export interface CreateCustomSlotFormData {
  physicianId?: string;
  date: string;
  startTime: string;
  endTime: string;
  slotTypeIds: string[];
  locationIds?: string[];
}

interface CreateCustomSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSubmit: (data: CreateCustomSlotFormData) => void;
  isLoading?: boolean;
}

export function CreateCustomSlotModal({
  open,
  onOpenChange,
  selectedDate,
  onSubmit,
  isLoading = false,
}: CreateCustomSlotModalProps) {
  const { user } = useAuthStore();
  const { hasAnyPermission } = usePermissions();
  const hasManageAllSlots = hasAnyPermission([
    PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
  ]);

  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");

  // Generate time options in 12-hour format (every minute from 12:00 AM to 11:59 PM)
  const generateTimeOptions = useCallback((minTimeMinutes?: number): string[] => {
    const options: string[] = [];
    const now = new Date();
    const isToday = DateManager.isToday(selectedDate)

    // Determine minimum time in minutes
    let minMinutes = 0;
    if (minTimeMinutes !== undefined) {
      minMinutes = minTimeMinutes;
    } else if (isToday) {
      // Add 1 minute buffer to current time
      minMinutes = now.getHours() * 60 + now.getMinutes() + 1;
    }

    // Generate all times in 24-hour format first, then convert to 12-hour
    for (let hour24 = 0; hour24 < 24; hour24++) {
      for (let minute = 0; minute < 60; minute++) {
        const currentMinutes = hour24 * 60 + minute;

        // Skip times before minimum
        if (currentMinutes < minMinutes) {
          continue;
        }

        const period = hour24 >= 12 ? "PM" : "AM";
        let displayHour = hour24 % 12;
        if (displayHour === 0) displayHour = 12; // 0 and 12 both become 12

        options.push(
          `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`
        );
      }
    }

    return options;
  }, [selectedDate]);

  // Get available start time options (filtered by current time if today)
  const startTimeOptions = useMemo(() => {
    return generateTimeOptions();
  }, [generateTimeOptions]);

  // Get available end time options (filtered by selected start time and current time)
  const endTimeOptions = useMemo(() => {
    if (!startTime) return generateTimeOptions();

    const start24 = convert12To24Hour(startTime);
    if (!start24) return generateTimeOptions();

    const [startH, startM] = start24.split(":").map(Number);
    const startMinutes = startH * 60 + startM;

    // Minimum end time is 1 minute after start time
    const minEndMinutes = startMinutes + 1;

    return generateTimeOptions(minEndMinutes);
  }, [startTime, generateTimeOptions]);
  const [selectedSlotTypeIds, setSelectedSlotTypeIds] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string | null>(
    null,
  );
  const [physicianSearchQuery, setPhysicianSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedPhysicianSearch = useDebounce(physicianSearchQuery, 500);
  const searchValue =
    debouncedPhysicianSearch.trim() === "" ||
      debouncedPhysicianSearch.toLowerCase() === "all"
      ? undefined
      : debouncedPhysicianSearch.trim();

  const { data: slotTypes = [], isLoading: isLoadingSlotTypes } = useSlotTypes();
  const { data: physiciansData } = usePhysiciansPaginated({
    page: 1,
    limit: 10,
    search: searchValue,
  });
  const physicians: Physician[] = physiciansData?.physicians || [];

  // Determine which physician ID to use
  const physicianId = useMemo(() => {
    if (hasManageAllSlots) {
      return selectedPhysicianId || user?.id || null;
    }
    return user?.id || null;
  }, [hasManageAllSlots, selectedPhysicianId, user?.id]);

  const { data: ownLocations = [] } = usePhysicianLocations();
  const { data: adminLocations = [] } = usePhysicianLocationsByPhysicianId(
    hasManageAllSlots && physicianId ? physicianId : null,
  );
  const locations =
    hasManageAllSlots && physicianId ? adminLocations : ownLocations;
  const activeLocations = locations.filter((loc) => loc.status === "active");

  const hasOfflineType = useMemo(() => {
    return selectedSlotTypeIds.some((typeId) => {
      const type = slotTypes.find((t) => t.id === typeId);
      return (
        type &&
        (type.type.toLowerCase() === "onsite" ||
          type.type.toLowerCase() === "offline")
      );
    });
  }, [selectedSlotTypeIds, slotTypes]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      // Set default times when modal opens based on selected date
      const now = new Date();
      const isToday = formatDate(selectedDate, "yyyy-MM-dd") === formatDate(now, "yyyy-MM-dd");

      // Set default times based on current time if today, otherwise use defaults
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes() + 1; // Add 1 minute buffer
        const period = currentHour >= 12 ? "PM" : "AM";
        const displayHour = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
        const defaultStart = `${String(displayHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")} ${period}`;
        // Default end time is 1 hour after start
        const endHour = currentHour + 1;
        const endPeriod = endHour >= 12 ? "PM" : "AM";
        const endDisplayHour = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour;
        const defaultEnd = `${String(endDisplayHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")} ${endPeriod}`;
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
      } else {
        setStartTime("09:00 AM");
        setEndTime("10:00 AM");
      }
    } else {
      // Reset form state when modal closes
      setStartTime("09:00 AM");
      setEndTime("10:00 AM");
      setSelectedSlotTypeIds([]);
      setSelectedLocationId("");
      setSelectedPhysicianId(null);
      setPhysicianSearchQuery("");
      setErrors({});
    }
  }, [open, selectedDate]);


  const handleSlotTypeToggle = (typeId: string) => {
    setSelectedSlotTypeIds((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
    if (errors.slotType) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slotType;
        return newErrors;
      });
    }
  };

  // Handle time changes
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // Clear error if it exists
    if (errors.times) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.times;
        return newErrors;
      });
    }
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    // Clear error if it exists
    if (errors.times) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.times;
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validate physician selection for admin
    if (hasManageAllSlots && !selectedPhysicianId) {
      newErrors.physician = "Please select a physician";
    }

    // Validate slot types
    if (selectedSlotTypeIds.length === 0) {
      newErrors.slotType = "Please select at least one consultation type";
    }

    // Validate location for offline types
    if (hasOfflineType && !selectedLocationId) {
      newErrors.location = "Please select a location for onsite consultations";
    }

    // Validate times with detailed error messages
    if (!startTime || !endTime) {
      newErrors.times = "Both start and end times are required";
    } else {
      const start24 = convert12To24Hour(startTime);
      const end24 = convert12To24Hour(endTime);

      if (!start24 || !end24) {
        newErrors.times = "Invalid time format";
      } else {
        const [startH, startM] = start24.split(":").map(Number);
        const [endH, endM] = end24.split(":").map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Check if date is today
        const now = new Date();
        const isToday = formatDate(selectedDate, "yyyy-MM-dd") === formatDate(now, "yyyy-MM-dd");
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Validate start time is in the future if today
        if (isToday && startMinutes <= currentMinutes) {
          newErrors.times = "Start time must be in the future";
        } else if (endMinutes <= startMinutes) {
          newErrors.times = "End time must be after start time";
        } else if (isToday && endMinutes <= currentMinutes) {
          newErrors.times = "End time must be in the future";
        } else {
          const durationMinutes = endMinutes - startMinutes;
          if (durationMinutes <= 0) {
            newErrors.times = "End time must be after start time";
          } else if (durationMinutes > 480) {
            newErrors.times = "Slot duration cannot exceed 8 hours";
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare form data
    const start24 = convert12To24Hour(startTime);
    const end24 = convert12To24Hour(endTime);
    const dateString = formatDate(selectedDate, "yyyy-MM-dd");

    const formData: CreateCustomSlotFormData = {
      physicianId: hasManageAllSlots ? physicianId || undefined : undefined,
      date: dateString,
      startTime: start24,
      endTime: end24,
      slotTypeIds: selectedSlotTypeIds,
      locationIds: hasOfflineType && selectedLocationId ? [selectedLocationId] : undefined,
    };

    // Call parent's onSubmit handler
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Slot</DialogTitle>
          <DialogDescription>
            Create a custom-sized time slot for{" "}
            {formatDate(selectedDate, "MMM dd, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Date Display */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <Label className="text-sm font-medium text-teal-900 mb-1 block">
              Selected Date
            </Label>
            <p className="text-lg font-semibold text-teal-900">
              {formatDate(selectedDate, "MMM dd, yyyy")}
            </p>
          </div>

          {/* Admin Physician Selection */}
          {hasManageAllSlots && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select Physician <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search physicians..."
                  value={physicianSearchQuery}
                  onChange={(e) => setPhysicianSearchQuery(e.target.value)}
                  className={errors.physician ? "border-red-500" : ""}
                />
                {physicianSearchQuery && physicians.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {physicians.map((physician) => (
                      <div
                        key={physician.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedPhysicianId(physician.id);
                          setPhysicianSearchQuery("");
                          if (errors.physician) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.physician;
                              return newErrors;
                            });
                          }
                        }}
                      >
                        {physician.firstName} {physician.lastName}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPhysicianId && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm">
                      Selected:{" "}
                      {
                        physicians.find((p) => p.id === selectedPhysicianId)
                          ?.firstName
                      }{" "}
                      {
                        physicians.find((p) => p.id === selectedPhysicianId)
                          ?.lastName
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPhysicianId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {errors.physician && (
                  <p className="text-sm text-red-500 mt-1">{errors.physician}</p>
                )}
              </div>
            </div>
          )}

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Select value={startTime} onValueChange={handleStartTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {startTimeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Select value={endTime} onValueChange={handleEndTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {endTimeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {errors.times && (
            <p className="text-sm text-red-500">{errors.times}</p>
          )}

          {/* Slot Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Consultation Type <span className="text-red-500">*</span>
            </Label>
            {isLoadingSlotTypes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {slotTypes.map((type: SlotType) => (
                  <div
                    key={type.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={type.id}
                      checked={selectedSlotTypeIds.includes(type.id)}
                      onCheckedChange={() => handleSlotTypeToggle(type.id)}
                    />
                    <Label
                      htmlFor={type.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {type.type}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {errors.slotType && (
              <p className="text-sm text-red-500">{errors.slotType}</p>
            )}
          </div>

          {/* Location Selection for Offline Types */}
          {hasOfflineType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Location <span className="text-red-500">*</span>
              </Label>
              {activeLocations.length === 0 ? (
                <p className="text-sm text-yellow-600">
                  No active locations found. Please add locations first.
                </p>
              ) : (
                <RadioGroup
                  value={selectedLocationId}
                  onValueChange={(value) => {
                    setSelectedLocationId(value);
                    if (errors.location) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.location;
                        return newErrors;
                      });
                    }
                  }}
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {activeLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-start space-x-2"
                      >
                        <RadioGroupItem
                          value={location.id}
                          id={`loc-${location.id}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`loc-${location.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div className="font-medium">
                            {location.locationName}
                          </div>
                          {location.address && (
                            <div className="text-xs text-gray-600">
                              {location.address}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Slot"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { CreateCustomSlotModalProps };

