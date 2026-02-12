import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BookingCalendar } from "@/features/dashboard/components/BookingCalendar";
import { useCreateCustomSlot } from "@/hooks/mutations/useBooking";
import { CreateCustomSlotModal } from "./CreateCustomSlotModal";
import type { CreateCustomSlotFormData } from "./CreateCustomSlotModal";

interface CalendarViewProps {
	onAddTimeSlot: () => void;
	selectedDate: Date;
	onDateSelect: (date: Date | undefined) => void;
	calendarMonth: Date;
	onMonthChange: (date: Date) => void;
	availableDates: Date[];
	isLoadingDates: boolean;
}

export function AppointmentsCalendarView({
	onAddTimeSlot,
	selectedDate,
	onDateSelect,
	calendarMonth,
	onMonthChange,
	availableDates,
	isLoadingDates,
}: CalendarViewProps) {
	const [isCustomSlotModalOpen, setIsCustomSlotModalOpen] = useState(false);
	const createCustomSlotMutation = useCreateCustomSlot();

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) return;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const selected = new Date(date);
		selected.setHours(0, 0, 0, 0);
		if (selected < today) return;
		onDateSelect(date);
	};

	const handleCreateCustomSlot = (data: CreateCustomSlotFormData) => {
		createCustomSlotMutation.mutate(data, {
			onSuccess: () => {
				setIsCustomSlotModalOpen(false);
			},
		});
	};

	return (
		<div className="space-y-6">
			{isLoadingDates && (
				<div className="flex justify-end">
					<Loader2 className="h-4 w-4 animate-spin text-teal-600" />
				</div>
			)}
			<BookingCalendar
				selectedDate={selectedDate}
				onDateSelect={handleDateSelect}
				calendarMonth={calendarMonth}
				onMonthChange={onMonthChange}
				availableDates={availableDates}
				isLoading={isLoadingDates}
			/>

			<div className="grid grid-cols-2 gap-4">
				<Button
					className="py-6"
					style={{
						background: "#00856F",
						borderRadius: "12px",
						fontSize: "16px",
						fontWeight: 600,
					}}
					onClick={onAddTimeSlot}
					data-testid="button-add-time-slot"
				>
					Add Time Slot
				</Button>
				<Button
					className="py-6"
					variant="outline"
					style={{
						borderColor: "#00856F",
						color: "#00856F",
						borderRadius: "12px",
						fontSize: "16px",
						fontWeight: 600,
					}}
					onClick={() => setIsCustomSlotModalOpen(true)}
					data-testid="button-create-custom-slot"
				>
					Create Custom Slot
				</Button>
			</div>

			<CreateCustomSlotModal
				open={isCustomSlotModalOpen}
				onOpenChange={setIsCustomSlotModalOpen}
				selectedDate={selectedDate}
				onSubmit={handleCreateCustomSlot}
				isLoading={createCustomSlotMutation.isPending}
			/>
		</div>
	);
}
