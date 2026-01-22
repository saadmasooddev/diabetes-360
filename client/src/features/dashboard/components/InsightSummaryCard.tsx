import { Card } from "@/components/ui/card";
import { Loader2, type LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface InsightSummaryCardProps {
	title: string;
	icon: LucideIcon;
	iconColor: string;
	gradientColors: {
		from: string;
		to: string;
	};
	borderColor: string;
	shadowColor: string;
	iconBgColor: string;
	isLoading?: boolean;
	insight?: string;
	testId?: string;
}

export function InsightSummaryCard({
	title,
	icon: Icon,
	iconColor,
	gradientColors,
	borderColor,
	shadowColor,
	iconBgColor,
	isLoading = false,
	insight,
	testId,
}: InsightSummaryCardProps) {
	// Hide card if there's an error and no insight data
	if (!isLoading && !insight) {
		return null;
	}

	return (
		<Card
			className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
			style={{
				background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
				border: `1px solid ${borderColor}`,
				borderRadius: "16px",
				boxShadow: `0 2px 8px ${shadowColor}`,
			}}
			data-testid={testId}
		>
			{isLoading ? (
				<div className="flex w-full h-full items-center justify-center gap-2 ">
					<Loader2
						className="h-5 w-5 animate-spin"
						style={{ color: "#546E7A" }}
					/>
					<p style={{ fontSize: "14px", color: "#546E7A" }}>
						Loading insights...
					</p>
				</div>
			) : (
				<div className="flex items-start gap-3">
					<div
						className="flex items-center justify-center rounded-xl"
						style={{
							width: "52px",
							height: "52px",
							background: iconBgColor,
							boxShadow: `0 4px 8px ${shadowColor}`,
						}}
					>
						<Icon style={{ width: "26px", height: "26px", color: "#FFFFFF" }} />
					</div>
					<div className="flex-1">
						<h3
							className="mb-2"
							style={{
								fontSize: "17px",
								fontWeight: 700,
								color: "#00453A",
							}}
						>
							{title}
						</h3>
						{insight && (
							<p
								style={{
									fontSize: "14px",
									color: "#546E7A",
									lineHeight: "22px",
								}}
							>
								{insight}
							</p>
						)}
					</div>
				</div>
			)}
		</Card>
	);
}
