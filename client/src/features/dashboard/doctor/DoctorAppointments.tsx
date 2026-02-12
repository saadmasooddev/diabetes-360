import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppointmentsCalendarView } from "./components/AppointmentsCalendarView";
import { AppointmentsListView } from "./components/AppointmentsListView";
import { SlotManagementView } from "./components/SlotManagementView";
import { useDatesWithBookings } from "@/hooks/mutations/useBooking";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { DateManager } from "@/lib/utils";

type ViewMode = "calendar" | "appointments" | "slotManagement";

export function DoctorAppointments() {
	const [location] = useLocation();
	const [viewMode, setViewMode] = useState<ViewMode>("calendar");
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

	const { data: datesWithBookings, isLoading: isLoadingDates } =
		useDatesWithBookings(
			calendarMonth.getMonth() + 1,
			calendarMonth.getFullYear(),
		);

	const availableDates = useMemo(
		() => datesWithBookings?.bookedSlots?.map((d) => new Date(d.date)) ?? [],
		[datesWithBookings],
	);
	const datesSet = useMemo(
		() =>
			new Set(datesWithBookings?.bookedSlots?.map((d) => d.date) ?? []),
		[datesWithBookings],
	);
	const hasAppointmentsOnSelected = datesSet.has(
		DateManager.formatDate(selectedDate),
	);

	// Reset to calendar when route changes
	useEffect(() => {
		setViewMode("calendar");
		setSelectedDate(new Date());
	}, [location]);

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
	};

	const handleViewAppointments = () => {
		setViewMode("appointments");
	};

	const handleAddTimeSlot = () => {
		setViewMode("slotManagement");
	};

	const handleBackToCalendar = useCallback(() => {
		setViewMode("calendar");
	}, []);

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<main className="flex-1 p-6 lg:p-8 overflow-auto">
				<div className="max-w-6xl mx-auto">
					{viewMode !== "slotManagement" && (
						<h1
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#00453A",
								marginBottom: "24px",
							}}
							data-testid="text-appointments-title"
						>
							Appointments
						</h1>
					)}

					{viewMode === "calendar" && (
						<div className="space-y-6">
							<AppointmentsCalendarView
								onAddTimeSlot={handleAddTimeSlot}
								selectedDate={selectedDate}
								onDateSelect={(date: Date | undefined) =>
									date && handleDateSelect(date)
								}
								calendarMonth={calendarMonth}
								onMonthChange={setCalendarMonth}
								availableDates={availableDates}
								isLoadingDates={isLoadingDates}
							/>
							{hasAppointmentsOnSelected && (
								<div className=" w-full flex justify-center sm:justify-start">
									<Button
										onClick={handleViewAppointments}
										className=" w-full gap-2 py-6 px-8 text-base font-semibold rounded-xl shadow-sm"
										style={{
											background: "#00856F",
											color: "white",
										}}
										data-testid="button-view-appointments"
									>
										<CalendarDays size={20} />
										View Appointments
									</Button>
								</div>
							)}
						</div>
					)}

					{viewMode === "appointments" && (
						<AppointmentsListView
							onAddTimeSlot={handleAddTimeSlot}
							onBackToCalendar={handleBackToCalendar}
							selectedDate={selectedDate}
						/>
					)}

					{viewMode === "slotManagement" && (
						<SlotManagementView
							onBack={handleBackToCalendar}
							selectedDate={selectedDate}
						/>
					)}
				</div>
			</main>
		</div>
	);
}
