import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonSpinner, InlineLoader } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	useDatesWithAvailability,
	useSlotsForDate,
	useUpdateSlotLocations,
} from "@/hooks/mutations/useBooking";
import { usePhysicianLocationsByPhysicianId } from "@/hooks/mutations/usePhysician";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Edit2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Slot } from "@/services/bookingService";
import { cn, formatTime12 } from "@/lib/utils";
import { formatDate } from "date-fns";
import { SlotCardSkeleton } from "@/components/ui/skeletons";
import { BookingCalendar } from "@/features/dashboard/components/BookingCalendar";

interface AdminPhysicianSlotManagementProps {
	physicianId: string;
}

export function AdminPhysicianSlotManagement({
	physicianId,
}: AdminPhysicianSlotManagementProps) {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [editingLocationSlotId, setEditingLocationSlotId] = useState<
		string | null
	>(null);
	const [editingLocationId, setEditingLocationId] = useState<string | null>(
		null,
	);
	const [calendarKey, setCalendarKey] = useState(0);

	const { data: datesWithAvailability = [], isLoading: isLoadingDates } =
		useDatesWithAvailability(physicianId);
	const {
		data: slots = [],
		isLoading: isLoadingSlots,
		refetch: refetchSlots,
	} = useSlotsForDate(
		physicianId,
		selectedDate ? formatDate(selectedDate, "yyyy-MM-dd") : null,
	);

	const updateLocationMutation = useUpdateSlotLocations();

	const availableDates = datesWithAvailability.map((d) => {
		if (typeof d === "string") {
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
				title: "Invalid Date",
				description: "You can only select future dates.",
				variant: "destructive",
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
			setSelectedDate(new Date());
			// Force calendar re-render to allow same date selection
			setCalendarKey((prev) => prev + 1);
		}
	};

	const handleEditLocations = (slot: Slot) => {
		setEditingLocationSlotId(slot.id);
		// Set the first location if any exist, otherwise null
		setEditingLocationId(
			slot.locations && slot.locations.length > 0 ? slot.locations[0].id : null,
		);
	};

	const handleSaveLocations = async () => {
		if (!editingLocationSlotId || !editingLocationId) return;
		updateLocationMutation.mutate({
			slotId: editingLocationSlotId,
			data: { locationIds: [editingLocationId] },
		});
		setEditingLocationSlotId(null);
		setEditingLocationId(null);
		await refetchSlots();
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
					{isLoadingDates ? (
						<div className="flex justify-center items-center py-8">
							<InlineLoader text="Loading availability dates..." />
						</div>
					) : (
						<BookingCalendar
							selectedDate={selectedDate}
							onDateSelect={handleDateSelect}
							availableDates={availableDates}
							onMonthChange={setCalendarMonth}
							calendarMonth={calendarMonth}
						/>
					)}
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<div className="w-4 h-4 bg-teal-100 rounded"></div>
						<span>Dates with availability</span>
					</div>
				</div>

				{/* View Slots Modal */}
				<Dialog open={isViewModalOpen} onOpenChange={handleModalClose}>
					<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
						<DialogHeader className="pb-4">
							<DialogTitle>
								Slots for{" "}
								{selectedDate ? formatDate(selectedDate, "MMM dd, yyyy") : ""}
							</DialogTitle>
							<DialogDescription>
								View and manage consultation slots (Admin can edit prices for
								unbooked slots)
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 pt-2">
							{isLoadingSlots ? (
								<div className="space-y-3">
									{Array.from({ length: 3 }).map((_, i) => (
										<SlotCardSkeleton key={i} />
									))}
								</div>
							) : slots.length === 0 ? (
								<p className="text-center text-gray-500 py-8">
									No slots created for this date
								</p>
							) : (
								slots.map((slot: Slot) => (
									<AdminSlotCard
										key={slot.id}
										slot={slot}
										onEditLocations={handleEditLocations}
										editingLocationSlotId={editingLocationSlotId}
										editingLocationId={editingLocationId}
										onLocationIdChange={setEditingLocationId}
										onSaveLocations={handleSaveLocations}
										onCancelLocationEdit={() => {
											setEditingLocationSlotId(null);
											setEditingLocationId(null);
										}}
										physicianId={physicianId}
										updateLocationMutation={updateLocationMutation}
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
	onEditLocations: (slot: Slot) => void;
	editingLocationSlotId: string | null;
	editingLocationId: string | null;
	onLocationIdChange: (id: string | null) => void;
	onSaveLocations: () => void;
	onCancelLocationEdit: () => void;
	physicianId: string;
	updateLocationMutation: ReturnType<typeof useUpdateSlotLocations>;
}

function AdminSlotCard({
	slot,
	onEditLocations,
	editingLocationSlotId,
	editingLocationId,
	onLocationIdChange,
	onSaveLocations,
	onCancelLocationEdit,
	physicianId,
	updateLocationMutation,
}: AdminSlotCardProps) {
	const isBooked = slot.isBooked;
	const isEditingLocations = editingLocationSlotId === slot.id;

	// Check if slot has offline/onsite type
	const hasOfflineType = slot.types?.some(
		(type) =>
			type.type.toLowerCase() === "onsite" ||
			type.type.toLowerCase() === "offline",
	);

	// Fetch all locations for this physician
	const { data: allLocations = [], isLoading: isLoadingLocations } =
		usePhysicianLocationsByPhysicianId(physicianId);
	const availableLocations = allLocations.filter(
		(loc) => loc.status === "active",
	);

	return (
		<div
			className={cn(
				"border rounded-lg p-4 space-y-2 transition-all",
				isBooked
					? "bg-orange-50 border-orange-200 shadow-sm"
					: "bg-white border-gray-200 hover:border-teal-300",
			)}
		>
			<div className="flex justify-between items-start">
				<div>
					<p
						className={cn(
							"font-medium",
							isBooked ? "text-orange-900" : "text-gray-900",
						)}
					>
						{formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
					</p>
					<p
						className={cn(
							"text-sm",
							isBooked ? "text-orange-700" : "text-gray-600",
						)}
					>
						{slot.slotSize?.size} minutes •{" "}
						{slot.types?.map((t: any) => t.type).join(", ")}
					</p>
				</div>
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
							{isLoadingLocations ? (
								<div className="p-2">
									<InlineLoader text="Loading locations..." />
								</div>
							) : availableLocations.length === 0 ? (
								<p className="text-sm text-yellow-600">
									No active locations found for this physician. Please ask the
									physician to add locations first.
								</p>
							) : (
								<RadioGroup
									value={editingLocationId || ""}
									onValueChange={(value) => onLocationIdChange(value || null)}
								>
									<div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
										{availableLocations.map((location) => (
											<div
												key={location.id}
												className="flex items-start space-x-2"
											>
												<RadioGroupItem
													value={location.id}
													id={`admin-edit-loc-${location.id}`}
													className="mt-1"
												/>
												<Label
													htmlFor={`admin-edit-loc-${location.id}`}
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
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={onSaveLocations}
									disabled={
										!editingLocationId || updateLocationMutation.isPending
									}
									className="bg-teal-600 hover:bg-teal-700"
								>
									{updateLocationMutation.isPending ? (
										<>
											<ButtonSpinner className="mr-1 h-3 w-3" />
											Saving...
										</>
									) : (
										"Save"
									)}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={onCancelLocationEdit}
									disabled={updateLocationMutation.isPending}
								>
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-1">
							{slot.locations && slot.locations.length > 0 ? (
								<div className="text-sm p-2 bg-gray-50 rounded">
									<div className="font-medium">
										{slot.locations[0].locationName}
									</div>
									{slot.locations[0].address && (
										<div className="text-xs text-gray-600">
											{slot.locations[0].address}
										</div>
									)}
								</div>
							) : (
								<p className="text-sm text-gray-500 italic">
									No location assigned
								</p>
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
