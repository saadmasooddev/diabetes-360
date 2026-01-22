import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarProps {
	selectedDate: Date | undefined;
	onSelectDate: (date: Date) => void;
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const daysInMonth = new Date(
		currentMonth.getFullYear(),
		currentMonth.getMonth() + 1,
		0,
	).getDate();

	const firstDayOfMonth = new Date(
		currentMonth.getFullYear(),
		currentMonth.getMonth(),
		1,
	).getDay();

	const monthYear = format(currentMonth, "MMMM yyyy");

	const handlePreviousMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
		);
	};

	const handleNextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
		);
	};

	const handleDateClick = (day: number) => {
		const date = new Date(
			currentMonth.getFullYear(),
			currentMonth.getMonth(),
			day,
		);
		onSelectDate(date);
	};

	const isSelectedDate = (day: number) => {
		if (!selectedDate) return false;
		return (
			selectedDate.getDate() === day &&
			selectedDate.getMonth() === currentMonth.getMonth() &&
			selectedDate.getFullYear() === currentMonth.getFullYear()
		);
	};

	const isTodayDate = (day: number) => {
		const today = new Date();
		return (
			today.getDate() === day &&
			today.getMonth() === currentMonth.getMonth() &&
			today.getFullYear() === currentMonth.getFullYear()
		);
	};

	const renderCalendarDays = () => {
		const days = [];
		const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

		for (let i = 0; i < totalCells; i++) {
			const dayNumber = i - firstDayOfMonth + 1;
			const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

			days.push(
				<div
					key={i}
					className={`flex items-center justify-center h-10 ${
						isValidDay ? "cursor-pointer" : ""
					}`}
					onClick={isValidDay ? () => handleDateClick(dayNumber) : undefined}
					data-testid={isValidDay ? `calendar-day-${dayNumber}` : undefined}
				>
					{isValidDay && (
						<div
							className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
								isSelectedDate(dayNumber)
									? "bg-[#E0F2EE] text-[#00453A] font-semibold"
									: isTodayDate(dayNumber)
										? "text-[#00856F] font-semibold"
										: "text-[#00453A] hover:bg-[#F7F9F9]"
							}`}
						>
							{dayNumber}
						</div>
					)}
				</div>,
			);
		}

		return days;
	};

	const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

	return (
		<div className="w-full">
			<div className="flex items-center justify-between mb-6">
				<h3
					style={{
						fontSize: "16px",
						fontWeight: 600,
						color: "#00453A",
					}}
					data-testid="calendar-month-year"
				>
					{monthYear}
				</h3>
				<div className="flex gap-2">
					<button
						onClick={handlePreviousMonth}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F9F9] transition-colors"
						data-testid="button-previous-month"
					>
						<ChevronLeft size={20} color="#00856F" />
					</button>
					<button
						onClick={handleNextMonth}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F9F9] transition-colors"
						data-testid="button-next-month"
					>
						<ChevronRight size={20} color="#00856F" />
					</button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-2 mb-3">
				{weekDays.map((day) => (
					<div
						key={day}
						className="text-center"
						style={{
							fontSize: "12px",
							fontWeight: 500,
							color: "#00856F",
							letterSpacing: "0.4px",
						}}
					>
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
		</div>
	);
}
