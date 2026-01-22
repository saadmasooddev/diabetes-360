import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation } from "lucide-react";
import type { PhysicianLocation } from "@/services/bookingService";
import { sortLocationByDistance } from "@/lib/utils";

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

	const sortedLocations = sortLocationByDistance(locations, locationDistances);

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
			<div className="flex items-center gap-2 mb-3">
				<MapPin className="h-4 w-4" style={{ color: "#00856F" }} />
				<label className="text-sm font-semibold" style={{ color: "#00453A" }}>
					Filter by Location
				</label>
			</div>
			<Select
				value={selectedLocationId || "all"}
				onValueChange={(value) =>
					onLocationChange(value === "all" ? null : value)
				}
			>
				<SelectTrigger className="w-full sm:w-72 border-gray-300 focus:border-[#00856F] focus:ring-[#00856F]">
					<SelectValue placeholder="All Locations" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-gray-500" />
							<span>All Locations</span>
							<span className="text-xs text-gray-500 ml-auto">
								({locations.length})
							</span>
						</div>
					</SelectItem>
					{sortedLocations.map((location) => {
						const distance = locationDistances[location.id];
						return (
							<SelectItem key={crypto.randomUUID()} value={location.id}>
								<div className="flex items-center gap-2 w-full">
									<MapPin className="h-4 w-4 text-[#00856F] flex-shrink-0" />
									<span className="flex-1">{location.locationName}</span>
									{distance !== undefined && (
										<div className="flex items-center gap-1 text-xs text-gray-600">
											<Navigation className="h-3 w-3" />
											<span>{distance.toFixed(1)} km</span>
										</div>
									)}
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}
