import { cn, formatTime12 } from "@/lib/utils";
import { Clock, Video, MapPin } from "lucide-react";
import type { Slot } from "@/services/bookingService";

interface SlotCardProps {
	slot: Slot;
	isSelected: boolean;
	onClick: () => void;
	defaultDisplay: "online" | "offline";
}

function hasOnlineType(slot: Slot): boolean {
	return slot.types?.some((t) => t.type.toLowerCase() === "online") || false;
}

function hasOfflineType(slot: Slot): boolean {
	return (
		slot.types?.some(
			(t) =>
				t.type.toLowerCase() === "onsite" || t.type.toLowerCase() === "offline",
		) || false
	);
}

export function SlotCard({
	slot,
	isSelected,
	onClick,
	defaultDisplay,
}: SlotCardProps) {
	const hasOnline = hasOnlineType(slot);
	const hasOffline = hasOfflineType(slot);

	return (
		<button
			onClick={onClick}
			className={cn(
				"group relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
				"hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
				"focus:outline-none focus:ring-2 focus:ring-[#00856F] focus:ring-offset-2",
				isSelected
					? "border-[#00856F] bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] shadow-md"
					: "border-gray-200 bg-white hover:border-[#00856F]/50 hover:bg-gradient-to-br hover:from-[#F7F9F9] hover:to-white",
			)}
		>
			{/* Time Display */}
			<div className="flex items-center gap-2 mb-2">
				<Clock
					className="h-4 w-4"
					style={{ color: isSelected ? "#00856F" : "#6B7280" }}
				/>
				<div className="flex flex-col">
					<span
						className={cn(
							"font-semibold text-base",
							isSelected ? "text-[#00453A]" : "text-[#1F2937]",
						)}
					>
						{formatTime12(slot.startTime)}
					</span>
					<span className="text-xs text-gray-500">
						to {formatTime12(slot.endTime)}
					</span>
				</div>
			</div>

			{/* Consultation Type Badges */}
			<div className="flex flex-wrap gap-1.5 mt-3">
				{hasOnline && defaultDisplay === "online" && (
					<div
						className={cn(
							"flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
							isSelected
								? "bg-[#00856F]/20 text-[#00856F]"
								: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
						)}
					>
						<Video className="h-3 w-3" />
						<span>Online</span>
					</div>
				)}
				{hasOffline && defaultDisplay === "offline" && (
					<div
						className={cn(
							"flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
							isSelected
								? "bg-[#00856F]/20 text-[#00856F]"
								: "bg-green-50 text-green-700 group-hover:bg-green-100",
						)}
					>
						<MapPin className="h-3 w-3" />
						<span>In-Person</span>
					</div>
				)}
			</div>

			{/* Selection Indicator */}
			{isSelected && (
				<div className="absolute top-2 right-2">
					<div className="w-2 h-2 rounded-full bg-[#00856F] animate-pulse" />
				</div>
			)}
		</button>
	);
}
