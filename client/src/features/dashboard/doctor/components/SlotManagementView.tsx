import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, X, Trash2 } from "lucide-react";
import {
	useSlotSizes,
	useSlotTypes,
	useSlotsForDate,
	useGenerateSlotsForDay,
	useCreateSlots,
	useBulkDeleteSlots,
	useUpdateSlot,
	useCreateCustomSlot,
} from "@/hooks/mutations/useBooking";
import { EditSlotModal, type EditSlotFormData } from "./EditSlotModal";
import {
	usePhysicianLocations,
	usePhysicianLocationsByPhysicianId,
} from "@/hooks/mutations/usePhysician";
import { usePhysiciansPaginated } from "@/hooks/mutations/usePhysician";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatTime12, cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import type { Physician } from "@/services/physicianService";
import { CreateSlotsRequest } from "@/services/bookingService";
import { DateManager } from "@/lib/utils";
import { SlotStartEnd } from "server/src/modules/booking/repository/booking.repository";
import { SLOT_TYPE } from "@shared/schema";

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

interface SlotManagementViewProps {
	onBack: () => void;
	selectedDate: Date | null;
}

export function SlotManagementView({
	onBack,
	selectedDate,
}: SlotManagementViewProps) {
	const { user } = useAuthStore();
	const { hasAnyPermission } = usePermissions();
	const hasManageAllSlots = hasAnyPermission([
		PERMISSIONS.MANAGE_PHYSICIAN_SLOTS,
	]);
	const { toast } = useToast();

	const userId = user?.id || null;
	const physicianId = hasManageAllSlots ? null : userId;
	const [selectedPhysicianId, setSelectedPhysicianId] = useState<string | null>(
		physicianId,
	);
	const [physicianSearchQuery, setPhysicianSearchQuery] = useState("");
	const [selectedSlotSizeId, setSelectedSlotSizeId] = useState<string>("");
	const [selectedSlotTypeIds, setSelectedSlotTypeIds] = useState<string[]>([]);
	const [selectedLocationId, setSelectedLocationId] = useState<string>("");

	// Separate state for existing slots and available slots
	const [selectedExistingSlots, setSelectedExistingSlots] = useState<
		Set<string>
	>(new Set());
	const [selectedAvailableSlots, setSelectedAvailableSlots] = useState<
		Set<number>
	>(new Set());

	const [editingSlot, setEditingSlot] = useState<
		(typeof existingSlots)[0] | null
	>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// Drag state for existing slots
	const [isDraggingExisting, setIsDraggingExisting] = useState(false);
	const [dragStartExistingIndex, setDragStartExistingIndex] = useState<
		number | null
	>(null);

	// Drag state for available slots
	const [isDraggingAvailable, setIsDraggingAvailable] = useState(false);
	const [dragStartAvailableIndex, setDragStartAvailableIndex] = useState<
		number | null
	>(null);

	const debouncedPhysicianSearch = useDebounce(physicianSearchQuery, 500);
	const searchValue =
		debouncedPhysicianSearch.trim() === "" ||
			debouncedPhysicianSearch.toLowerCase() === "all"
			? undefined
			: debouncedPhysicianSearch.trim();

	const { data: physiciansData } = usePhysiciansPaginated({
		page: 1,
		limit: 10,
		search: searchValue,
	});

	const physicians: Physician[] = physiciansData?.physicians || [];

	function getDateString(date: Date) {
		if (DateManager.isToday(date)) {
			return date.toISOString();
		}
		return DateManager.startOfDay(date).toISOString();
	}

	const dateString = selectedDate ? getDateString(selectedDate) : null;

	const { data: slotSizes = [] } = useSlotSizes();
	const { data: slotTypes = [] } = useSlotTypes();
	const {
		data: existingSlots = [],
		isLoading: isLoadingSlots,
		refetch: refetchSlots,
		isRefetching: isRefetchingSlots,
	} = useSlotsForDate(selectedPhysicianId, dateString);
	const { data: ownLocations = [] } = usePhysicianLocations();
	const { data: adminLocations = [] } =
		usePhysicianLocationsByPhysicianId(selectedPhysicianId);
	const locations =
		hasManageAllSlots && selectedPhysicianId ? adminLocations : ownLocations;
	const activeLocations = locations.filter((loc) => loc.status === "active");

	const generateSlotsMutation = useGenerateSlotsForDay();
	const createSlotsIndividualMutation = useCreateSlots();
	const bulkDeleteMutation = useBulkDeleteSlots();
	const updateSlotMutation = useUpdateSlot();
	const createCustomSlotMutation = useCreateCustomSlot();

	const [generatedSlots, setGeneratedSlots] = useState<Array<SlotStartEnd>>([]);
	const [conflicts, setConflicts] = useState<Array<SlotStartEnd>>([]);

	// Separate slots into booked, existing unbooked, and generated
	const bookedSlots = useMemo(() => {
		return existingSlots.filter((slot) => slot.isBooked);
	}, [existingSlots]);

	const unbookedExistingSlots = useMemo(() => {
		return existingSlots.filter((slot) => !slot.isBooked);
	}, [existingSlots]);

	function generateSlots(physicianId: string, date: Date) {
		generateSlotsMutation.mutate(
			{
				physicianId: hasManageAllSlots ? physicianId : undefined,
				date: date.getTime().toString(),
				slotSizeId: selectedSlotSizeId,
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			},
			{
				onSuccess: (data) => {
					setGeneratedSlots(data.availableSlots);
					setConflicts(data.conflicts);
				},
			},
		);
	}
	// Generate slots when slot size changes
	useEffect(() => {
		if (selectedSlotSizeId && dateString && selectedPhysicianId) {
			const date = new Date(dateString);
			if (!DateManager.isToday(date)) {
				date.setHours(0, 0, 0, 0);
			}

			generateSlots(selectedPhysicianId, date);
		} else {
			setGeneratedSlots([]);
			setConflicts([]);
		}
	}, [selectedSlotSizeId, dateString, selectedPhysicianId, hasManageAllSlots]);

	const handleSlotTypeToggle = (typeId: string) => {
		setSelectedSlotTypeIds((prev) =>
			prev.includes(typeId)
				? prev.filter((id) => id !== typeId)
				: [...prev, typeId],
		);
	};

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

	// Handle edit button click
	const handleEditSlot = () => {
		if (selectedExistingSlots.size === 1) {
			const slotId = Array.from(selectedExistingSlots)[0];
			const slot = unbookedExistingSlots.find((s) => s.id === slotId);
			if (slot) {
				setEditingSlot(slot);
				setIsEditModalOpen(true);
			}
		}
	};

	// Handle drag for existing slots
	const handleExistingDragStart = (index: number, e: React.MouseEvent) => {
		e.preventDefault();
		setIsDraggingExisting(true);
		setDragStartExistingIndex(index);
		const slot = unbookedExistingSlots[index];
		if (slot) {
			setSelectedExistingSlots((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(slot.id)) {
					newSet.delete(slot.id);
				} else newSet.add(slot.id);
				return newSet;
			});
		}
	};

	const handleExistingDragOver = (index: number, e: React.MouseEvent) => {
		if (!isDraggingExisting || dragStartExistingIndex === null) return;
		e.preventDefault();

		const start = Math.min(dragStartExistingIndex, index);
		const end = Math.max(dragStartExistingIndex, index);
		const newSet = new Set<string>();
		for (let i = start; i <= end; i++) {
			const slot = unbookedExistingSlots[i];
			if (slot) {
				newSet.add(slot.id);
			}
		}
		setSelectedExistingSlots(newSet);
	};

	const handleExistingDragEnd = () => {
		setIsDraggingExisting(false);
		setDragStartExistingIndex(null);
	};

	const handleAvailableDragStart = (index: number, e: React.MouseEvent) => {
		e.preventDefault();
		setIsDraggingAvailable(true);
		setDragStartAvailableIndex(index);
		setSelectedAvailableSlots((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(index)) {
				newSet.delete(index);
			} else {
				newSet.add(index);
			}
			return newSet;
		});
	};

	const handleAvailableDragOver = (index: number, e: React.MouseEvent) => {
		if (!isDraggingAvailable || dragStartAvailableIndex === null) return;
		e.preventDefault();

		const start = Math.min(dragStartAvailableIndex, index);
		const end = Math.max(dragStartAvailableIndex, index);
		const newSet = new Set<number>();
		for (let i = start; i <= end; i++) {
			newSet.add(i);
		}
		setSelectedAvailableSlots(newSet);
	};

	const handleAvailableDragEnd = () => {
		setIsDraggingAvailable(false);
		setDragStartAvailableIndex(null);
	};

	const handleCreateSlots = async () => {
		if (
			!selectedSlotSizeId ||
			selectedSlotTypeIds.length === 0 ||
			!dateString ||
			!selectedPhysicianId
		) {
			toast({
				title: "Validation Error",
				description: "Please select slot size and at least one slot type.",
				variant: "destructive",
			});
			return;
		}

		if (hasOfflineType && !selectedLocationId) {
			toast({
				title: "Validation Error",
				description:
					"Please select a location for onsite/offline consultations.",
				variant: "destructive",
			});
			return;
		}

		if (selectedAvailableSlots.size === 0) {
			toast({
				title: "Validation Error",
				description: "Please select at least one slot to create.",
				variant: "destructive",
			});
			return;
		}

		// Create only selected slots
		const slotsToCreate = Array.from(selectedAvailableSlots)
			.sort((a, b) => a - b)
			.map((index) => generatedSlots[index])
			.filter(Boolean);

		if (slotsToCreate.length === 0) {
			toast({
				title: "Validation Error",
				description: "No valid slots selected.",
				variant: "destructive",
			});
			return;
		}

		const date = new Date(dateString);
		if (!DateManager.isToday(date)) {
			date.setHours(0, 0, 0, 0);
		}
		// Create slots in groups
		const payload: CreateSlotsRequest = {
			date: date.getTime().toString(),
			slotSizeId: selectedSlotSizeId,
			slotTimes: slotsToCreate,
			slotTypeIds: selectedSlotTypeIds,
			locationIds: hasOfflineType ? [selectedLocationId] : undefined,
			physicianId: selectedPhysicianId,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		createSlotsIndividualMutation.mutate(payload);

		// Remove created slots from generatedSlots
		const createdSlotTimes = new Set(
			slotsToCreate.map((slot) => `${slot.startTime}-${slot.endTime}`),
		);
		setGeneratedSlots((prev) =>
			prev.filter(
				(slot) => !createdSlotTimes.has(`${slot.startTime}-${slot.endTime}`),
			),
		);

		await refetchSlots();
		setSelectedSlotTypeIds([]);
		setSelectedLocationId("");
		setSelectedAvailableSlots(() => new Set());
	};

	const handleBulkDelete = async () => {
		if (selectedExistingSlots.size === 0 || !selectedPhysicianId) return;

		bulkDeleteMutation.mutate(
			{
				physicianId: hasManageAllSlots ? selectedPhysicianId : undefined,
				slotIds: Array.from(selectedExistingSlots),
			},
			{
				onSuccess: async (result) => {
					await refetchSlots();
					if (dateString)
						generateSlots(selectedPhysicianId, new Date(dateString));
					setSelectedExistingSlots(new Set());

					if (result.failed.length > 0) {
						toast({
							title: "Partial Success",
							description: `Some slots could not be deleted (may have been booked).`,
							variant: "default",
						});
					}
				},
			},
		);
	};

	const handleEditSlotSubmit = async (data: EditSlotFormData) => {
		if (!editingSlot) return;

		if (editingSlot.isCustom) {
			// For custom slots, use updateSlot
			updateSlotMutation.mutate(
				{
					slotId: editingSlot.id,
					data: {
						startTime: data.startTime,
						endTime: data.endTime,
						slotTypeIds: data.slotTypeIds,
						locationIds: data.locationIds,
					},
				},
				{
					onSuccess: async () => {
						setIsEditModalOpen(false);
						setEditingSlot(null);
						setSelectedExistingSlots(new Set());
						await refetchSlots();
					},
				},
			);
		} else {
			// For non-custom slots, only update types and locations
			updateSlotMutation.mutate(
				{
					slotId: editingSlot.id,
					data: {
						slotTypeIds: data.slotTypeIds,
						locationIds: data.locationIds,
					},
				},
				{
					onSuccess: async () => {
						setIsEditModalOpen(false);
						setEditingSlot(null);
						setSelectedExistingSlots(new Set());
						await refetchSlots();
					},
				},
			);
		}
	};

	const handleCreateCustomSlot = async (data: EditSlotFormData) => {
		if (!dateString || !selectedPhysicianId) return;

		createCustomSlotMutation.mutate(
			{
				physicianId: hasManageAllSlots ? selectedPhysicianId : undefined,
				date: dateString,
				startTime: data.startTime!,
				endTime: data.endTime!,
				slotTypeIds: data.slotTypeIds,
				locationIds: data.locationIds,
			},
			{
				onSuccess: async () => {
					setIsEditModalOpen(false);
					setEditingSlot(null);
					await refetchSlots();
				},
			},
		);
	};

	if (!selectedDate) {
		return (
			<div className="space-y-6">
				<Button onClick={onBack} variant="outline">
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<p className="text-center text-gray-500">Please select a date first</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Button onClick={onBack} variant="outline" className="mb-4">
				<ChevronLeft className="mr-2 h-4 w-4" />
				Back
			</Button>

			<h2 className="text-2xl font-bold text-[#00453A]">
				Manage Slots for {formatDate(selectedDate, "MMM dd, yyyy")}
			</h2>

			{/* Admin Physician Selection */}
			{hasManageAllSlots && (
				<Card className="p-4">
					<Label className="mb-2 block">Select Physician</Label>
					<div className="relative">
						<Input
							placeholder="Search physicians..."
							value={physicianSearchQuery}
							onChange={(e) => setPhysicianSearchQuery(e.target.value)}
							className="mb-2"
						/>
						{physicianSearchQuery && physicians.length > 0 && (
							<div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
								{physicians.map((physician) => (
									<div
										key={physician.id}
										className="p-2 hover:bg-gray-100 cursor-pointer"
										onClick={() => {
											setSelectedPhysicianId(physician.id);
											setPhysicianSearchQuery("");
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
					</div>
				</Card>
			)}

			{!selectedPhysicianId && (
				<Card className="p-4">
					<p className="text-center text-gray-500">
						{hasManageAllSlots ? "Please select a physician" : "Loading..."}
					</p>
				</Card>
			)}

			{selectedPhysicianId && (
				<>
					{/* Slot Size Selection */}
					<Card className="p-4">
						<Label className="mb-2 block">Select Slot Size</Label>
						<Select
							value={selectedSlotSizeId}
							onValueChange={setSelectedSlotSizeId}
						>
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
					</Card>

					{/* Booked Slots */}
					{isLoadingSlots || isRefetchingSlots ? (
						<Card className="p-4">
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-teal-600" />
							</div>
						</Card>
					) : (
						<>
							{bookedSlots.length > 0 && (
								<Card className="p-4">
									<h3 className="font-semibold mb-3 text-orange-900">
										Booked Slots
									</h3>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
										{bookedSlots.map((slot) => (
											<div
												key={slot.id}
												className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
											>
												<p className="font-medium text-orange-900">
													{formatTime12(slot.startTime)} -{" "}
													{formatTime12(slot.endTime)}
												</p>
												<p className="text-xs text-orange-700">Booked</p>
											</div>
										))}
									</div>
								</Card>
							)}

							{/* Existing Unbooked Slots */}
							{unbookedExistingSlots.length > 0 && (
								<Card className="p-4">
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-semibold text-gray-900">
											Existing Unbooked Slots
										</h3>
										<div className="flex items-center gap-2">
											{selectedExistingSlots.size === 1 && (
												<Button
													variant="outline"
													size="sm"
													onClick={handleEditSlot}
												>
													Edit Slot
												</Button>
											)}
											{selectedExistingSlots.size > 0 && (
												<Button
													variant="destructive"
													size="sm"
													onClick={handleBulkDelete}
													disabled={bulkDeleteMutation.isPending}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete Selected ({selectedExistingSlots.size})
												</Button>
											)}
										</div>
									</div>
									<div
										className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
										onMouseUp={handleExistingDragEnd}
										onMouseLeave={handleExistingDragEnd}
									>
										{unbookedExistingSlots.map((slot, index) => {
											const isSelected = selectedExistingSlots.has(slot.id);
											return (
												<div
													key={slot.id}
													className={cn(
														"p-3 border rounded-lg cursor-pointer transition-all select-none",
														isSelected
															? "bg-teal-100 border-teal-500"
															: "bg-white border-gray-200 hover:border-teal-300",
													)}
													onMouseDown={(e) => handleExistingDragStart(index, e)}
													onMouseMove={(e) => handleExistingDragOver(index, e)}
												>
													<p className="font-medium text-gray-900">
														{formatTime12(slot.startTime)} -{" "}
														{formatTime12(slot.endTime)}
													</p>
													{slot.types && slot.types.length > 0 && (
														<p className="text-xs text-gray-600">
															{slot.types.map((t) => t.type).join(", ")}
														</p>
													)}
													{slot.locations &&
														slot.types?.some(
															(t) => t.type === SLOT_TYPE.ONSITE,
														) &&
														slot.locations.length > 0 && (
															<div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
																<MapPin className="h-3 w-3" />
																{slot.locations[0].locationName}
															</div>
														)}
												</div>
											);
										})}
									</div>
								</Card>
							)}

							{/* Generated Slots */}
							{selectedSlotSizeId && (
								<Card className="p-4">
									<h3 className="font-semibold mb-3 text-teal-900">
										Available Slots to Create
									</h3>
									{generateSlotsMutation.isPending ? (
										<div className="flex items-center justify-center py-8">
											<Loader2 className="h-6 w-6 animate-spin text-teal-600" />
										</div>
									) : generatedSlots.length > 0 ? (
										<>
											<div className="flex items-center justify-between mb-3">
												<h3 className="font-semibold text-teal-900">
													Select slots to create ({selectedAvailableSlots.size}{" "}
													selected)
												</h3>
												{selectedAvailableSlots.size > 0 && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedAvailableSlots(new Set())}
													>
														Clear Selection
													</Button>
												)}
											</div>
											<div
												className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4"
												onMouseUp={handleAvailableDragEnd}
												onMouseLeave={handleAvailableDragEnd}
											>
												{generatedSlots.map((slot, index) => {
													const isSelected = selectedAvailableSlots.has(index);
													return (
														<div
															key={index}
															className={cn(
																"p-3 border rounded-lg cursor-pointer transition-all select-none",
																isSelected
																	? "bg-teal-100 border-teal-500"
																	: "bg-teal-50 border-teal-200 hover:border-teal-300",
															)}
															onMouseDown={(e) =>
																handleAvailableDragStart(index, e)
															}
															onMouseMove={(e) =>
																handleAvailableDragOver(index, e)
															}
														>
															<p
																className={cn(
																	"font-medium",
																	isSelected
																		? "text-teal-900"
																		: "text-teal-700",
																)}
															>
																{formatTime12(slot.startTime)} -{" "}
																{formatTime12(slot.endTime)}
															</p>
														</div>
													);
												})}
											</div>

											{/* Slot Type Selection */}
											<div className="mb-4">
												<Label className="mb-2 block">
													Select Consultation Types
												</Label>
												<div className="space-y-2">
													{slotTypes.map((type) => (
														<div
															key={type.id}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={type.id}
																checked={selectedSlotTypeIds.includes(type.id)}
																onCheckedChange={() =>
																	handleSlotTypeToggle(type.id)
																}
															/>
															<Label
																htmlFor={type.id}
																className="flex-1 cursor-pointer"
															>
																{type.type}
															</Label>
														</div>
													))}
												</div>
											</div>

											{/* Location Selection for Offline Types */}
											{hasOfflineType && (
												<div className="mb-4">
													<Label className="mb-2 flex items-center gap-2">
														<MapPin className="h-4 w-4" />
														Select Location (Required for offline consultations)
													</Label>
													{activeLocations.length === 0 ? (
														<p className="text-sm text-yellow-600">
															No active locations found. Please add locations
															first.
														</p>
													) : (
														<RadioGroup
															value={selectedLocationId}
															onValueChange={setSelectedLocationId}
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
												</div>
											)}

											<Button
												onClick={handleCreateSlots}
												disabled={
													createSlotsIndividualMutation.isPending ||
													selectedSlotTypeIds.length === 0 ||
													(hasOfflineType && !selectedLocationId) ||
													selectedAvailableSlots.size === 0
												}
												className="w-full bg-teal-600 hover:bg-teal-700"
											>
												{createSlotsIndividualMutation.isPending ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Creating...
													</>
												) : (
													`Create ${selectedAvailableSlots.size} Selected Slot(s)`
												)}
											</Button>
										</>
									) : (
										<p className="text-center text-gray-500 py-4">
											{conflicts.length > 0
												? "All time slots conflict with existing slots. Please delete existing slots first."
												: "Select a slot size to generate available slots."}
										</p>
									)}
								</Card>
							)}
						</>
					)}
				</>
			)}

			{/* Edit Slot Modal */}
			{selectedDate && (
				<EditSlotModal
					open={isEditModalOpen}
					onOpenChange={setIsEditModalOpen}
					selectedDate={selectedDate}
					slot={
						editingSlot
							? {
								...editingSlot,
								isCustom: editingSlot.isCustom,
							}
							: undefined
					}
					onSubmit={editingSlot ? handleEditSlotSubmit : handleCreateCustomSlot}
					isLoading={
						updateSlotMutation.isPending || createCustomSlotMutation.isPending
					}
				/>
			)}
		</div>
	);
}

React.memo(SlotManagementView);
