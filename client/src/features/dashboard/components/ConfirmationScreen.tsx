import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { Doctor } from "@/mocks/doctors";
import type { Hospital } from "@/mocks/hospitals";

interface ConfirmationScreenProps {
	doctor: Doctor;
	date: Date;
	time: string;
	hospital: Hospital;
	onBack: () => void;
}

export function ConfirmationScreen({
	doctor,
	date,
	time,
	hospital,
	onBack,
}: ConfirmationScreenProps) {
	const formattedDate = format(date, "d MMMM yyyy");

	return (
		<div className="w-full max-w-[800px]">
			{/* Header with Back Button */}
			<div className="flex items-center gap-4 mb-6 sm:mb-8">
				<button
					onClick={onBack}
					className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#E0F2F1] transition-colors"
					data-testid="button-back-confirmation"
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
					data-testid="text-confirmation-title"
				>
					Confirmation
				</h1>
			</div>

			{/* Confirmation Card */}
			<Card
				className="p-4 sm:p-8 mb-4 sm:mb-6"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
				data-testid="card-confirmation"
			>
				{/* Doctor Information */}
				<div className="mb-6">
					<h2
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#00453A",
						}}
						data-testid="text-confirmation-doctor-name"
					>
						{doctor.name}
					</h2>
					<p
						style={{
							fontSize: "14px",
							fontWeight: 400,
							color: "#00856F",
						}}
						data-testid="text-confirmation-doctor-specialty"
					>
						{doctor.specialty}
					</p>
				</div>

				{/* Date & Time Section */}
				<div className="mb-6">
					<h3
						className="mb-3"
						style={{
							fontSize: "14px",
							fontWeight: 600,
							color: "#00453A",
						}}
						data-testid="text-date-time-label"
					>
						Date & Time
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div
							className="p-4 rounded-lg text-center"
							style={{
								background: "#F7F9F9",
							}}
							data-testid="display-date"
						>
							<span
								style={{
									fontSize: "14px",
									fontWeight: 500,
									color: "#00453A",
								}}
							>
								{formattedDate}
							</span>
						</div>
						<div
							className="p-4 rounded-lg text-center"
							style={{
								background: "#F7F9F9",
							}}
							data-testid="display-time"
						>
							<span
								style={{
									fontSize: "14px",
									fontWeight: 500,
									color: "#00453A",
								}}
							>
								{time}
							</span>
						</div>
					</div>
				</div>

				{/* Location Section */}
				<div>
					<h3
						className="mb-3"
						style={{
							fontSize: "14px",
							fontWeight: 600,
							color: "#00453A",
						}}
						data-testid="text-location-label"
					>
						Location
					</h3>
					<div
						className="p-4 rounded-lg text-center"
						style={{
							background: "#F7F9F9",
						}}
						data-testid="display-hospital"
					>
						<span
							style={{
								fontSize: "14px",
								fontWeight: 500,
								color: "#00453A",
							}}
						>
							{hospital.name}
						</span>
					</div>
				</div>
			</Card>

			{/* Appointment Booked Banner */}
			<div
				className="w-full py-6 rounded-lg text-center"
				style={{
					background: "#E0F2F1",
				}}
				data-testid="banner-appointment-booked"
			>
				<h2
					style={{
						fontSize: "20px",
						fontWeight: 600,
						color: "#00453A",
					}}
				>
					Appointment Booked
				</h2>
			</div>
		</div>
	);
}
