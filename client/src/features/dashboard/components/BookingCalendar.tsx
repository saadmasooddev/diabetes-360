import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface BookingCalendarProps {
	selectedDate: Date;
	onDateSelect: (date: Date | undefined) => void;
	calendarMonth: Date;
	onMonthChange: (date: Date) => void;
	availableDates: Date[];
	isLoading?: boolean;
}

function startOfDay(d: Date): Date {
	const copy = new Date(d);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

export function BookingCalendar({
	selectedDate,
	onDateSelect,
	calendarMonth,
	onMonthChange,
	availableDates,
	isLoading = false,
}: BookingCalendarProps) {
	const selectedNormalized = startOfDay(selectedDate);

	return (
		<Card
			className="w-full p-6 sm:p-8 mb-4 sm:mb-6"
			style={{
				background: "#FFFFFF",
				border: "1px solid rgba(0, 0, 0, 0.1)",
				borderRadius: "16px",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
			}}
		>
			<div className="w-full relative">
				{isLoading && (
					<div className="absolute top-2 right-2 z-10">
						<Loader2 className="h-4 w-4 animate-spin text-teal-600" />
					</div>
				)}
				<div className="w-full">
					<div className="w-full [&_.rdp]:w-full [&_.rdp-table]:w-full [&_.rdp-cell]:flex-1 [&_.rdp-day]:w-full [&_.rdp-day]:h-12 [&_.rdp-head_cell]:flex-1">
						<Calendar
							mode="single"
							selected={selectedNormalized}
							onSelect={onDateSelect}
							month={calendarMonth}
							onMonthChange={onMonthChange}
							disabled={(date) => {
								const today = new Date();
								today.setHours(0, 0, 0, 0);
								return date < today;
							}}
							modifiers={{
								hasAvailability: availableDates,
							}}
							modifiersClassNames={{
								hasAvailability:
									"bg-teal-100 text-teal-900 font-semibold hover:bg-teal-200",
							}}
							className="w-full"
							classNames={{
								months:
									"flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0 w-full",
								month: "space-y-4 w-full",
								caption: "flex justify-center pt-1 relative items-center mb-4",
								caption_label: "text-lg font-semibold text-[#00453A]",
								nav_button_previous: "absolute left-1 hover:bg-teal-50",
								nav_button_next: "absolute right-1 hover:bg-teal-50",
								table: "w-full border-collapse",
								head_row: "flex w-full justify-between mb-2",
								head_cell:
									"text-[#00856F] rounded-md font-semibold text-sm flex-1 text-center py-2",
								row: "flex w-full mt-1 justify-between",
								cell: "m-1 flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
								day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-teal-50 transition-all duration-200 flex items-center justify-center text-sm",
								day_selected:
									"!bg-[#00856F] !text-white hover:!bg-[#006B5B] hover:!text-white",
								day_today:
									" border-2 border-[#00856F] hover:text-black font-semibold",
								day_disabled: " bg-white opacity-30  ",
							}}
						/>
					</div>
					<div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
						<div className="w-4 h-4 bg-teal-100 rounded"></div>
						<span>Dates with available slots</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
