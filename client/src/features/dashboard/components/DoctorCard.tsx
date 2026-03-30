import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhysicianAvatar } from "@/components/physician/PhysicianAvatar";
import { Star } from "lucide-react";
import type { Doctor } from "@/mocks/doctors";

interface DoctorCardProps {
	doctor: Doctor;
	onConsultClick: (doctor: Doctor) => void;
	variant?: "default" | "compact";
	nextSlotLabel?: string | null;
}

export function DoctorCard({
	doctor,
	onConsultClick,
	variant = "default",
	nextSlotLabel,
}: DoctorCardProps) {
	const isCompact = variant === "compact";

	function renderStars(rating: number) {
		return [...Array(5)].map((_, i) => {
			const starValue = i + 1;
			const filled = starValue <= Math.round(rating);
			const halfFilled = !filled && starValue - 0.5 <= rating;
			return (
				<Star
					key={i}
					size={14}
					fill={filled ? "#00856F" : halfFilled ? "#00856F" : "none"}
					stroke={filled || halfFilled ? "#00856F" : "#B0BEC5"}
					data-testid={`star-${starValue}-${doctor.id}`}
					style={{ opacity: halfFilled ? 0.5 : 1 }}
				/>
			);
		});
	}

	return (
		<Card
			className={`${isCompact ? "p-4 sm:p-6" : "p-6"} flex flex-col sm:flex-row ${isCompact ? "gap-4 sm:gap-6" : "gap-6"}`}
			style={{
				background: "#FFFFFF",
				border: "1px solid rgba(0, 0, 0, 0.1)",
				borderRadius: "12px",
			}}
			data-testid={`card-doctor-${doctor.id}`}
		>
			<div className="relative flex-shrink-0">
				<div
					className={`relative ${isCompact ? "w-24 h-24 mx-auto sm:mx-0" : "w-32 h-32 sm:w-36 sm:h-36 mx-auto sm:mx-0"}`}
				>
					<div data-testid={`img-doctor-${doctor.id}`}>
						<PhysicianAvatar
							firstName={doctor.firstName}
							lastName={doctor.lastName}
							name={doctor.name}
							imageUrl={doctor.image || undefined}
							className={
								isCompact
									? "h-24 w-24 mx-auto sm:mx-0"
									: "h-32 w-32 sm:h-36 sm:w-36 mx-auto sm:mx-0"
							}
							imgClassName="border-4 border-[#E0F2F1]"
						/>
					</div>
					<div
						className={`absolute ${isCompact ? "top-0 left-0" : "top-2 left-2"} flex items-center gap-1.5 px-2 py-1 rounded-full`}
						style={{
							background: "#FFFFFF",
							boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
						}}
						data-testid={`status-${doctor.isOnline ? "online" : "offline"}-${doctor.id}`}
					>
						<div
							className="w-2 h-2 rounded-full"
							style={{
								background: doctor.isOnline ? "#00856F" : "#EF5350",
							}}
						/>
						<span
							style={{
								fontSize: "11px",
								fontWeight: 500,
								color: "#00453A",
							}}
						>
							{doctor.isOnline ? "Online" : "Offline"}
						</span>
					</div>
				</div>
			</div>

			<div
				className={`flex-1 flex flex-col justify-between min-w-0 ${isCompact ? "text-center sm:text-left" : ""}`}
			>
				<div>
					<h3
						className="mb-1"
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#00453A",
						}}
						data-testid={`text-doctor-name-${doctor.id}`}
					>
						{doctor.name}
					</h3>
					<p
						className={isCompact ? "mb-3" : "mb-4"}
						style={{
							fontSize: "14px",
							fontWeight: 400,
							color: "#00856F",
						}}
						data-testid={`text-specialty-${doctor.id}`}
					>
						{doctor.specialty}
					</p>

					<div
						className={
							isCompact
								? "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-2"
								: "flex flex-wrap gap-4 mb-4"
						}
					>
						{!doctor.experience.includes("0+") && (
							<div className="flex items-center gap-2">
								<span
									style={{
										fontSize: "12px",
										fontWeight: 500,
										color: "#00856F",
										textTransform: isCompact ? "none" : "uppercase",
										letterSpacing: isCompact ? "0" : "0.4px",
									}}
								>
									Experience
								</span>
								<span
									style={{
										fontSize: "14px",
										fontWeight: 500,
										color: "#546E7A",
									}}
									data-testid={`text-experience-${doctor.id}`}
								>
									{doctor.experience}
								</span>
							</div>
						)}
						{!isCompact && (
							<div className="flex items-center gap-2">
								<span
									style={{
										fontSize: "12px",
										fontWeight: 500,
										color: "#00856F",
										textTransform: "uppercase",
										letterSpacing: "0.4px",
									}}
								>
									Ratings
								</span>
								<div
									className="flex items-center gap-1"
									data-testid={`rating-${doctor.id}`}
								>
									{renderStars(doctor.rating)}
								</div>
							</div>
						)}
					</div>

					{isCompact && (
						<div className="flex items-center justify-center sm:justify-start gap-2">
							<span
								style={{
									fontSize: "12px",
									fontWeight: 500,
									color: "#00856F",
								}}
							>
								Ratings
							</span>
							<div
								className="flex items-center gap-1"
								data-testid={`rating-${doctor.id}`}
							>
								{renderStars(doctor.rating)}
							</div>
						</div>
					)}

					{nextSlotLabel && (
						<div
							className="text-sm text-[#546E7A]  flex flex-col gap-1  "
							data-testid={`text-next-slot-${doctor.id}`}
						>
							<span className="font-medium">Availability: </span>
							<span>{nextSlotLabel}</span>
						</div>
					)}
				</div>

				<Button
					onClick={() => onConsultClick(doctor)}
					className={`w-full ${isCompact ? "mt-4" : "sm:w-auto"}`}
					style={{
						background: "#00856F",
						color: "#FFFFFF",
						fontWeight: 600,
						fontSize: "14px",
						padding: "12px 32px",
						borderRadius: "8px",
						height: "auto",
					}}
					data-testid={`button-consult-${doctor.id}`}
					disabled={
						nextSlotLabel !== undefined && !nextSlotLabel
					}
				>
					Consult Now
				</Button>
			</div>
		</Card>
	);
}
