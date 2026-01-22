import { SlotCard } from "./SlotCard";
import { Moon, Sun, Sunset, Video } from "lucide-react";
import type { Slot } from "@/services/bookingService";
import { groupSlotsByPeriod } from "@/lib/utils";
import { getPeriodIcon } from "./BookingStep";

interface OnlineSlotsSectionProps {
	slots: Slot[];
	selectedSlotId: string | null;
	onSlotSelect: (slot: Slot) => void;
}

// Helper to get time period (Morning, Afternoon, Evening)
export function OnlineSlotsSection({
	slots,
	selectedSlotId,
	onSlotSelect,
}: OnlineSlotsSectionProps) {
	if (slots.length === 0) {
		return null;
	}

	const slotsByPeriod = groupSlotsByPeriod(slots);
	const periodOrder = ["Morning", "Afternoon", "Evening", "Night"];

	return (
		<div className="space-y-6">
			{/* Section Header */}
			<div className="flex items-center gap-3 mb-4">
				<div className="p-2 rounded-lg bg-blue-50">
					<Video className="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<h4 className="text-lg font-semibold" style={{ color: "#00453A" }}>
						Online Consultations
					</h4>
					<p className="text-sm text-gray-600">
						{slots.length} {slots.length === 1 ? "slot" : "slots"} available
					</p>
				</div>
			</div>

			{/* Grouped Slots by Time Period */}
			{periodOrder.map((period) => {
				const periodSlots = slotsByPeriod.get(period);
				if (!periodSlots || periodSlots.length === 0) return null;

				return (
					<div key={period} className="space-y-3">
						{/* Period Header */}
						<div className="flex items-center gap-2">
							<div
								className="flex items-center gap-1.5 text-sm font-medium"
								style={{ color: "#00856F" }}
							>
								{getPeriodIcon(period)}
								<span>{period}</span>
							</div>
							<div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
							<span className="text-xs text-gray-500">
								{periodSlots.length}{" "}
								{periodSlots.length === 1 ? "slot" : "slots"}
							</span>
						</div>

						{/* Slots Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
							{periodSlots.map((slot) => (
								<SlotCard
									defaultDisplay="online"
									key={slot.id}
									slot={slot}
									isSelected={selectedSlotId === slot.id}
									onClick={() => onSlotSelect(slot)}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
