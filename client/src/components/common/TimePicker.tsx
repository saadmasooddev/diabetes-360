import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
	selectedTime: string;
	onTimeChange: (time: string) => void;
}

export function TimePicker({ selectedTime, onTimeChange }: TimePickerProps) {
	const [hours, setHours] = useState("11");
	const [minutes, setMinutes] = useState("38");
	const [period, setPeriod] = useState<"AM" | "PM">("AM");

	useEffect(() => {
		if (selectedTime) {
			const [time, periodPart] = selectedTime.split(" ");
			const [h, m] = time.split(":");
			setHours(h);
			setMinutes(m);
			setPeriod(periodPart as "AM" | "PM");
		}
	}, [selectedTime]);

	useEffect(() => {
		onTimeChange(`${hours}:${minutes} ${period}`);
	}, [hours, minutes, period, onTimeChange]);

	const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "");
		if (value === "") {
			setHours("");
			return;
		}
		const num = parseInt(value);
		if (num >= 1 && num <= 12) {
			setHours(num.toString().padStart(2, "0"));
		} else if (num === 0) {
			setHours("12");
		}
	};

	const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "");
		if (value === "") {
			setMinutes("");
			return;
		}
		const num = parseInt(value);
		if (num >= 0 && num <= 59) {
			setMinutes(num.toString().padStart(2, "0"));
		}
	};

	return (
		<div className="flex items-center gap-4">
			<span
				style={{
					fontSize: "14px",
					fontWeight: 500,
					color: "#00453A",
				}}
			>
				Time
			</span>
			<div className="flex items-center gap-2">
				<input
					type="text"
					value={hours}
					onChange={handleHourChange}
					maxLength={2}
					className="w-12 h-10 text-center border rounded-md"
					style={{
						fontSize: "16px",
						fontWeight: 500,
						color: "#00453A",
						borderColor: "#E0E0E0",
					}}
					data-testid="input-hours"
				/>
				<span
					style={{
						fontSize: "16px",
						fontWeight: 500,
						color: "#00453A",
					}}
				>
					:
				</span>
				<input
					type="text"
					value={minutes}
					onChange={handleMinuteChange}
					maxLength={2}
					className="w-12 h-10 text-center border rounded-md"
					style={{
						fontSize: "16px",
						fontWeight: 500,
						color: "#00453A",
						borderColor: "#E0E0E0",
					}}
					data-testid="input-minutes"
				/>
				<div className="flex gap-1 ml-2">
					<Button
						onClick={() => setPeriod("AM")}
						className={`h-10 px-4 ${
							period === "AM"
								? "bg-[#00856F] text-white"
								: "bg-white text-[#00453A] border border-[#E0E0E0]"
						}`}
						style={{
							fontSize: "14px",
							fontWeight: 500,
							borderRadius: "6px",
						}}
						data-testid="button-am"
					>
						AM
					</Button>
					<Button
						onClick={() => setPeriod("PM")}
						className={`h-10 px-4 ${
							period === "PM"
								? "bg-[#00856F] text-white"
								: "bg-white text-[#00453A] border border-[#E0E0E0]"
						}`}
						style={{
							fontSize: "14px",
							fontWeight: 500,
							borderRadius: "6px",
						}}
						data-testid="button-pm"
					>
						PM
					</Button>
				</div>
			</div>
		</div>
	);
}
