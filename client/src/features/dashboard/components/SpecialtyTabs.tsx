import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Specialty {
	id: string;
	name: string;
}

interface SpecialtyTabsProps {
	specialties: Specialty[];
	selectedSpecialtyId: string | null;
	onSpecialtySelect: (specialtyId: string | null) => void;
	isLoading?: boolean;
}

export function SpecialtyTabs({
	specialties,
	selectedSpecialtyId,
	onSpecialtySelect,
	isLoading = false,
}: SpecialtyTabsProps) {
	if (isLoading) {
		return (
			<div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2">
				<Skeleton className="h-9 w-24 rounded-full" />
				<Skeleton className="h-9 w-32 rounded-full" />
				<Skeleton className="h-9 w-28 rounded-full" />
			</div>
		);
	}

	return (
		<div
			className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2"
			data-testid="section-specialty-tabs"
		>
			<button
				onClick={() => onSpecialtySelect(null)}
				className={cn(
					"px-4 sm:px-6 py-2 rounded-full whitespace-nowrap transition-all",
					selectedSpecialtyId === null ? "shadow-sm" : "",
				)}
				style={{
					background: selectedSpecialtyId === null ? "#E0F2F1" : "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					fontSize: "14px",
					fontWeight: selectedSpecialtyId === null ? 600 : 500,
					color: "#00453A",
				}}
			>
				All Doctors
			</button>
			{specialties.map((specialty) => (
				<button
					key={specialty.id}
					onClick={() => onSpecialtySelect(specialty.id)}
					className={cn(
						"px-4 sm:px-6 py-2 rounded-full whitespace-nowrap transition-all",
						selectedSpecialtyId === specialty.id ? "shadow-sm" : "",
					)}
					style={{
						background:
							selectedSpecialtyId === specialty.id ? "#E0F2F1" : "#FFFFFF",
						border: "1px solid rgba(0, 0, 0, 0.1)",
						fontSize: "14px",
						fontWeight: selectedSpecialtyId === specialty.id ? 600 : 500,
						color: "#00453A",
					}}
					data-testid={`tab-specialty-${specialty.id}`}
				>
					{specialty.name}
				</button>
			))}
		</div>
	);
}
