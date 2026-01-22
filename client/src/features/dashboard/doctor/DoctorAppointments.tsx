import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppointmentsCalendarView } from "./components/AppointmentsCalendarView";
import { AppointmentsListView } from "./components/AppointmentsListView";
import { SlotManagementView } from "./components/SlotManagementView";

type ViewMode = "calendar" | "appointments" | "slotManagement";

export function DoctorAppointments() {
	const [location] = useLocation();
	const [viewMode, setViewMode] = useState<ViewMode>("calendar");
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

	// Reset to calendar when route changes
	useEffect(() => {
		setViewMode("calendar");
		setSelectedDate(new Date());
	}, [location]);

	const handleDateClick = (date: Date, hasAppointments: boolean) => {
		setSelectedDate(date);
		if (hasAppointments) {
			setViewMode("appointments");
		}
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
						<AppointmentsCalendarView
							onDateClick={handleDateClick}
							onAddTimeSlot={handleAddTimeSlot}
							selectedDate={selectedDate}
							onDateSelect={(date: Date | undefined) =>
								date && setSelectedDate(date)
							}
							calendarMonth={calendarMonth}
							onMonthChange={setCalendarMonth}
						/>
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
