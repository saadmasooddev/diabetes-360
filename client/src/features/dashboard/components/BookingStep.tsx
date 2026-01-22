import { ArrowLeft, Moon, Sun, Sunset } from "lucide-react";
import { BookingCalendar } from "./BookingCalendar";
import { LocationFilter } from "./LocationFilter";
import { OnlineSlotsSection } from "./OnlineSlotsSection";
import { OfflineSlotsSection } from "./OfflineSlotsSection";
import { SlotCardSkeleton } from "@/components/ui/skeletons";
import type { Physician } from "@/services/physicianService";
import type { Slot, PhysicianLocation } from "@/services/bookingService";

const formatDate = (date: Date, formatStr: string): string => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	if (formatStr === "MMM dd, yyyy") {
		return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
	}
	if (formatStr === "yyyy-MM-dd") {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}
	return date.toLocaleDateString();
};

interface BookingStepProps {
	selectedPhysician: Physician;
	selectedDate: Date;
	onDateSelect: (date: Date | undefined) => void;
	calendarMonth: Date;
	onMonthChange: (date: Date) => void;
	availableDates: Date[];
	isLoadingDates: boolean;
	availableSlots: Slot[];
	isLoadingSlots: boolean;
	selectedSlot: Slot | null;
	onSlotSelect: (slot: Slot, defaultDisplay: "online" | "offline") => void;
	selectedLocationId: string | null;
	onLocationChange: (locationId: string | null) => void;
	locationDistances: Record<string, number>;
	onBack: () => void;
}

export function BookingStep({
	selectedPhysician,
	selectedDate,
	onDateSelect,
	calendarMonth,
	onMonthChange,
	availableDates,
	isLoadingDates,
	availableSlots,
	isLoadingSlots,
	selectedSlot,
	onSlotSelect,
	selectedLocationId,
	onLocationChange,
	locationDistances,
	onBack,
}: BookingStepProps) {
	// Get all unique locations from available slots
	const getAllLocations = (): PhysicianLocation[] => {
		const allLocations: PhysicianLocation[] = [];
		const locationMap = new Map<string, PhysicianLocation>();
		availableSlots
			.filter((slot) => !slot.isBooked)
			.forEach((slot) => {
				if (slot.locations) {
					slot.locations.forEach((loc) => {
						if (!locationMap.has(loc.id)) {
							locationMap.set(loc.id, loc);
							allLocations.push(loc);
						}
					});
				}
			});
		return allLocations;
	};

	// Separate and filter slots
	const getFilteredSlots = () => {
		const unbookedSlots = availableSlots.filter((slot) => !slot.isBooked);

		// Filter by location if selected
		const filteredSlots = selectedLocationId
			? unbookedSlots.filter((slot) =>
					slot.locations?.some((loc) => loc.id === selectedLocationId),
				)
			: unbookedSlots;

		// Separate online-only vs slots with offline/onsite
		const onlineSlots = filteredSlots.filter((slot) => {
			const hasOnline = slot.types?.some(
				(t) => t.type.toLowerCase() === "online",
			);
			return hasOnline;
		});

		const offlineSlots = filteredSlots.filter((slot) => {
			const hasOffline = slot.types?.some(
				(t) =>
					t.type.toLowerCase() === "onsite" ||
					t.type.toLowerCase() === "offline",
			);
			return hasOffline;
		});

		return { onlineSlots, offlineSlots, filteredSlots };
	};

	const { onlineSlots, offlineSlots, filteredSlots } = getFilteredSlots();
	const allLocations = getAllLocations();

	return (
		<div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
			<div className="w-full max-w-[800px]">
				{/* Header with Back Button */}
				<div className="flex items-center gap-4 mb-6 sm:mb-8">
					<button
						onClick={onBack}
						className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E0F2F1] transition-colors"
						data-testid="button-back"
					>
						<ArrowLeft size={24} color="#00856F" />
					</button>
					<h1
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#00856F",
						}}
						className="sm:text-2xl"
					>
						Book a Consultation
					</h1>
				</div>

				{/* Doctor Information */}
				<div className="mb-6 sm:mb-8">
					<h2
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#00453A",
						}}
					>
						{selectedPhysician.firstName + " " + selectedPhysician.lastName}
					</h2>
					<p
						style={{
							fontSize: "14px",
							fontWeight: 400,
							color: "#00856F",
						}}
					>
						{selectedPhysician.specialty}
					</p>
				</div>

				{/* Calendar */}
				<div className="w-full mb-6 sm:mb-8">
					<BookingCalendar
						selectedDate={selectedDate}
						onDateSelect={onDateSelect}
						calendarMonth={calendarMonth}
						onMonthChange={onMonthChange}
						availableDates={availableDates}
						isLoading={isLoadingDates}
					/>
				</div>

				{/* Available Slots */}
				{selectedDate && (
					<div className="mb-8">
						{/* Section Header */}
						<div className="mb-6">
							<div className="flex items-center justify-between mb-2">
								<h3
									className="text-xl font-semibold"
									style={{ color: "#00453A" }}
								>
									Available Slots
								</h3>
								<div
									className="text-sm font-medium px-3 py-1 rounded-full bg-[#E0F2F1]"
									style={{ color: "#00856F" }}
								>
									{formatDate(selectedDate, "MMM dd, yyyy")}
								</div>
							</div>
							<p className="text-sm text-gray-600">
								Select a time slot to book your consultation
							</p>
						</div>

						{isLoadingSlots && (
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
								{Array.from({ length: 10 }).map((_, index) => (
									<SlotCardSkeleton key={index} />
								))}
							</div>
						)}
						{!isLoadingSlots && (
							<>
								{/* Location Filter */}
								{allLocations.length > 0 && (
									<div className="mb-6">
										<LocationFilter
											locations={allLocations}
											selectedLocationId={selectedLocationId}
											onLocationChange={onLocationChange}
											locationDistances={locationDistances}
										/>
									</div>
								)}

								{/* Empty State */}
								{filteredSlots.length === 0 ? (
									<div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
										<div className="max-w-md mx-auto">
											<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
												<svg
													className="w-8 h-8 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
											</div>
											<h4
												className="text-lg font-semibold mb-2"
												style={{ color: "#00453A" }}
											>
												No slots available
											</h4>
											<p className="text-sm text-gray-600">
												{selectedLocationId
													? "No available slots for the selected location on this date. Try selecting a different location or date."
													: "No available slots for this date. Please select a different date."}
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-10">
										{/* Online Consultations Section */}
										{onlineSlots.length > 0 && (
											<div className="relative">
												<div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-transparent rounded-2xl -z-10" />
												<OnlineSlotsSection
													slots={onlineSlots}
													selectedSlotId={selectedSlot?.id || null}
													onSlotSelect={(slot) => onSlotSelect(slot, "online")}
												/>
											</div>
										)}

										{/* Divider between sections */}
										{onlineSlots.length > 0 && offlineSlots.length > 0 && (
											<div className="relative py-4">
												<div className="absolute inset-0 flex items-center">
													<div className="w-full border-t border-gray-200" />
												</div>
												<div className="relative flex justify-center">
													<span className="bg-white px-4 text-sm font-medium text-gray-500">
														OR
													</span>
												</div>
											</div>
										)}

										{/* In-Person Consultations Section */}
										{offlineSlots.length > 0 && (
											<div className="relative">
												<div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-transparent to-transparent rounded-2xl -z-10" />
												<OfflineSlotsSection
													slots={offlineSlots}
													selectedSlotId={selectedSlot?.id || null}
													onSlotSelect={(slot) => onSlotSelect(slot, "offline")}
													locationDistances={locationDistances}
												/>
											</div>
										)}
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export function getPeriodIcon(period: string) {
	switch (period) {
		case "Morning":
			return <Sun className="h-4 w-4" />;
		case "Afternoon":
			return <Sunset className="h-4 w-4" />;
		case "Evening":
			return <Moon className="h-4 w-4" />;
		default:
			return <Sun className="h-4 w-4" />;
	}
}
