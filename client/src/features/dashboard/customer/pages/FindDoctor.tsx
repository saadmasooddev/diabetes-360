import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatTime12 } from "@/lib/utils";
import { ConfirmationScreen } from "../../components/ConfirmationScreen";
import { DoctorSearchStep } from "../../components/DoctorSearchStep";
import { BookingStep } from "../../components/BookingStep";
import { BookingConfirmationDialog } from "../../components/BookingConfirmationDialog";
import {
	useSpecialties,
	usePhysiciansPaginated,
} from "@/hooks/mutations/usePhysician";
import { useToast } from "@/hooks/use-toast";
import {
	usePhysicianDatesWithSlots,
	useBookSlot,
	useCalculateBookingPrice,
	type PhysicianDatesWithSlots,
} from "@/hooks/mutations/useBooking";
import type { Physician } from "@/services/physicianService";
import type { Slot } from "@/services/bookingService";
import { calculateDistance, getCurrentLocation } from "@/utils/distance";
import { useDebounce } from "@/hooks/useDebounce";
import { queryClient } from "@/lib/queryClient";

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

function mapPhysicianToDoctor(physician: Physician) {
	return {
		id: physician.id,
		name: physician.firstName + " " + physician.lastName || "Dr. Unknown",
		specialty: physician.specialty || "",
		experience: physician.experience || "1+ years",
		rating: physician.rating || 0,
		isOnline: physician.isOnline || false,
		image: physician.imageUrl || "",
		consultationFee: physician.consultationFee
			? parseFloat(physician.consultationFee)
			: undefined,
	};
}

// Helper function to auto-select slot type based on slot's available types
function getAutoSelectedSlotTypeId(
	slot: Slot,
	defaultDisplay: "online" | "offline",
): string | null {
	if (!slot.types || slot.types.length === 0) {
		return null;
	}
	const filterType = defaultDisplay === "online" ? "online" : "onsite";
	const type = slot.types?.find((t) => t.type.toLowerCase() === filterType);
	if (type) return type.id;

	return slot.types[0]?.id || null;
}

export function FindDoctor() {
	const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
	const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(
		null,
	);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
	const [selectedSlotTypeId, setSelectedSlotTypeId] = useState<string | null>(
		null,
	);
	const [isConsultationTypeDialogOpen, setIsConsultationTypeDialogOpen] =
		useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(
		null,
	);
	const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
		null,
	);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [locationDistances, setLocationDistances] = useState<
		Record<string, number>
	>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [calendarMonth, setCalendarMonth] = useState(new Date());
	const pageLimit = 10;
	const debouncedSearchQuery = useDebounce(searchQuery, 500);

	const { toast } = useToast();
	const { data: specialties = [], isLoading: isLoadingSpecialties } =
		useSpecialties();

	const searchValue =
		debouncedSearchQuery.toLowerCase() === "all"
			? undefined
			: debouncedSearchQuery.trim();

	const {
		data: physiciansData,
		isLoading: isLoadingPhysicians,
		error: physiciansError,
	} = usePhysiciansPaginated({
		page: currentPage,
		limit: pageLimit,
		search: searchValue,
		specialtyId: selectedSpecialtyId,
	});

	const physicians: Physician[] = physiciansData?.physicians || [];
	const pagination = physiciansData?.pagination;

	// Reset to first page when specialty changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedSpecialtyId]);

	// Show error toast if there's an error
	useEffect(() => {
		if (physiciansError) {
			toast({
				title: "Error",
				description:
					physiciansError instanceof Error
						? physiciansError.message
						: "Failed to load physicians",
				variant: "destructive",
			});
		}
	}, [physiciansError, toast]);

	// Use unified API for dates and slots
	const currentMonth = calendarMonth.getMonth() + 1; // getMonth() returns 0-11
	const currentYear = calendarMonth.getFullYear();

	const getPhysicianDatesWithSlotsQueryKey = (): PhysicianDatesWithSlots => {
		const params = {
			physicianId: selectedPhysician?.id || null,
			month: currentMonth,
			year: currentYear,
			isCount: true, // Always get dates with counts for calendar
			selectedDate: formatDate(selectedDate, "yyyy-MM-dd"),
		};
		const key = [
			"booking",
			"physician-dates",
			params.physicianId,
			params.month,
			params.year,
			params.isCount,
			params.selectedDate,
		];
		return { key, params };
	};

	const { data: datesWithSlotsData, isLoading: isLoadingDatesAndSlots } =
		usePhysicianDatesWithSlots(getPhysicianDatesWithSlotsQueryKey());

	const datesWithAvailability = datesWithSlotsData?.dates?.filter(d => d.count > 0) || [];
	const availableSlots = datesWithSlotsData?.slots || [];
	const isLoadingDates = isLoadingDatesAndSlots;
	const isLoadingSlots = isLoadingDatesAndSlots;

	const { data: bookingPrice, isLoading: isLoadingPrice, refetch: refetchBookingPrice } =
		useCalculateBookingPrice(selectedPhysician?.id || null);
	const bookSlotMutation = useBookSlot();

	// Get user's current location
	useEffect(() => {
		getCurrentLocation()
			.then((location) => {
				setUserLocation(location);
			})
			.catch(() => {
				// User location unavailable - handled silently
			});
	}, []);

	// Calculate distances when slots or user location changes
	useEffect(() => {
		if (!userLocation || !availableSlots.length) {
			return;
		}

		const distances: Record<string, number> = {};
		availableSlots.forEach((slot) => {
			if (slot.locations && slot.locations.length > 0) {
				slot.locations.forEach((location) => {
					const lat = parseFloat(location.latitude);
					const lng = parseFloat(location.longitude);
					if (!isNaN(lat) && !isNaN(lng)) {
						distances[location.id] = calculateDistance(
							userLocation.lat,
							userLocation.lng,
							lat,
							lng,
						);
					}
				});
			}
		});
		setLocationDistances(distances);
	}, [availableSlots, userLocation?.lat, userLocation?.lng]);

	// Convert dates with counts to Date objects for calendar
	const availableDates = datesWithAvailability.map((d) => {
		return new Date(d.date);
	});

	const handleConsultClick = (physician: Physician) => {
		setSelectedPhysician(physician);
		setSelectedDate(new Date()); // Reset date when physician changes
		setCalendarMonth(new Date()); // Reset calendar to current month
		setCurrentStep(2);
	};

	const handleBackToList = () => {
		setCurrentStep(1);
		setSelectedPhysician(null);
		setSelectedDate(new Date());
		setSelectedSlot(null);
	};

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const selected = new Date(date);
		selected.setHours(0, 0, 0, 0);

		if (selected < today) {
			return;
		}

		setSelectedDate(date);
		setSelectedSlot(null);
		setSelectedLocationId(null); // Reset location filter when date changes

		// Update calendar month if selected date is in a different month
		if (
			selected.getMonth() !== calendarMonth.getMonth() ||
			selected.getFullYear() !== calendarMonth.getFullYear()
		) {
			setCalendarMonth(selected);
		}
	};

	const handleSlotSelect = (
		slot: Slot,
		defaultDisplay: "online" | "offline",
	) => {
		setSelectedSlot(slot);
		// Auto-select the appropriate slot type based on the slot's available types
		const autoSelectedTypeId = getAutoSelectedSlotTypeId(slot, defaultDisplay);
		setSelectedSlotTypeId(autoSelectedTypeId);
		setIsConsultationTypeDialogOpen(true);
	};

	const handleConfirmConsultationType = async () => {
		if (!selectedSlot || !selectedSlotTypeId || !selectedPhysician?.id) return;

		try {
			await bookSlotMutation.mutateAsync(
				{
					slotId: selectedSlot.id,
					slotTypeId: selectedSlotTypeId,
					physicianId: selectedPhysician.id
				},
				{
					onSuccess: () => {
						queryClient.invalidateQueries({
							queryKey: getPhysicianDatesWithSlotsQueryKey().key,
						});
						refetchBookingPrice()
					},
				},
			);
			setIsConsultationTypeDialogOpen(false);
			setCurrentStep(3);
		} catch (error) {
			// Error handled by mutation
		}
	};

	const handleBackToBooking = () => {
		setCurrentStep(2);
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 p-4  lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6  ">
					{currentStep === 1 ? (
						<DoctorSearchStep
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							specialties={specialties}
							selectedSpecialtyId={selectedSpecialtyId}
							onSpecialtySelect={setSelectedSpecialtyId}
							isLoadingSpecialties={isLoadingSpecialties}
							physicians={physicians}
							isLoadingPhysicians={isLoadingPhysicians}
							onConsultClick={handleConsultClick}
							pagination={pagination}
							onPageChange={setCurrentPage}
						/>
					) : currentStep === 2 ? (
						<>
							{selectedPhysician && (
								<BookingStep
									selectedPhysician={selectedPhysician}
									selectedDate={selectedDate}
									onDateSelect={handleDateSelect}
									calendarMonth={calendarMonth}
									onMonthChange={setCalendarMonth}
									availableDates={availableDates}
									isLoadingDates={isLoadingDates}
									availableSlots={availableSlots}
									isLoadingSlots={isLoadingSlots}
									selectedSlot={selectedSlot}
									onSlotSelect={handleSlotSelect}
									selectedLocationId={selectedLocationId}
									onLocationChange={setSelectedLocationId}
									locationDistances={locationDistances}
									onBack={handleBackToList}
								/>
							)}

							{/* Booking Confirmation Dialog */}
							<BookingConfirmationDialog
								isOpen={isConsultationTypeDialogOpen}
								onClose={() => {
									setIsConsultationTypeDialogOpen(false);
									setSelectedSlot(null);
									setSelectedSlotTypeId(null);
								}}
								selectedSlot={selectedSlot}
								selectedSlotTypeId={selectedSlotTypeId}
								onSlotTypeSelect={setSelectedSlotTypeId}
								bookingPrice={
									bookingPrice
										? {
											originalFee: bookingPrice.originalFee,
											discountedFee: bookingPrice.discountedFee,
											finalPrice: bookingPrice.finalPrice,
											isDiscounted: bookingPrice.isDiscounted,
											isFree: bookingPrice.isFree,
											discountPercentage: bookingPrice.discountPercentage,
										}
										: null
								}
								isLoadingPrice={isLoadingPrice}
								isBooking={bookSlotMutation.isPending}
								onConfirm={handleConfirmConsultationType}
								autoSelectedSlotTypeId={selectedSlotTypeId}
							/>
						</>
					) : (
						<div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
							{selectedPhysician && selectedDate && selectedSlot && (
								<ConfirmationScreen
									doctor={mapPhysicianToDoctor(selectedPhysician)}
									date={selectedDate}
									time={`${formatTime12(selectedSlot.startTime)} - ${formatTime12(selectedSlot.endTime)}`}
									hospital={{
										id: "1",
										name:
											selectedSlot.types?.map((t: any) => t.type).join(", ") ||
											"Online",
									}}
									onBack={handleBackToBooking}
								/>
							)}
						</div>
					)}

				</div>
			</main>
		</div>
	);
}
