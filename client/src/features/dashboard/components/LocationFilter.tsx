import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { PhysicianLocation } from '@/services/bookingService';

interface LocationFilterProps {
  locations: PhysicianLocation[];
  selectedLocationId: string | null;
  onLocationChange: (locationId: string | null) => void;
  locationDistances: Record<string, number>;
}

export function LocationFilter({
  locations,
  selectedLocationId,
  onLocationChange,
  locationDistances,
}: LocationFilterProps) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Label className="text-sm font-medium mb-2 block">Filter by Location</Label>
      <Select value={selectedLocationId || 'all'} onValueChange={(value) => onLocationChange(value === 'all' ? null : value)}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.locationName}
              {locationDistances[location.id] !== undefined && (
                <span className="text-xs text-gray-500 ml-2">
                  ({locationDistances[location.id]} km away)
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

