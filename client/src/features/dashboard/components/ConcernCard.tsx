import { Card } from "@/components/ui/card";
import { Stethoscope, Apple, Heart, Activity } from "lucide-react";
import type { Concern } from "@/mocks/concerns";

const concernIcons = {
	stethoscope: Stethoscope,
	apple: Apple,
	"heart-pulse": Heart,
	activity: Activity,
};

interface ConcernCardProps {
	concern: Concern;
	isSelected: boolean;
	onClick: () => void;
}

export function ConcernCard({
	concern,
	isSelected,
	onClick,
}: ConcernCardProps) {
	const IconComponent =
		concernIcons[concern.icon as keyof typeof concernIcons] || Stethoscope;

	return (
		<Card
			className="p-6 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
			style={{
				background: isSelected ? "#E0F2F1" : "#FFFFFF",
				border: "1px solid rgba(0, 0, 0, 0.1)",
				borderRadius: "12px",
			}}
			onClick={onClick}
			data-testid={`card-concern-${concern.id}`}
		>
			<div
				className="flex items-center justify-center rounded-full"
				style={{
					width: "48px",
					height: "48px",
					background: "#00856F",
				}}
			>
				<IconComponent size={24} color="#FFFFFF" />
			</div>
			<h3
				style={{
					fontSize: "18px",
					fontWeight: 600,
					color: "#00453A",
				}}
				data-testid={`text-concern-${concern.id}`}
			>
				{concern.name}
			</h3>
		</Card>
	);
}
