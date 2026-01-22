import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OverallHealthSummaryProps {
	summary?: string;
	isLoading?: boolean;
}

export function OverallHealthSummary({
	summary,
	isLoading = false,
}: OverallHealthSummaryProps) {
	// Hide component if there's an error and no summary data
	if (!isLoading && !summary) {
		return null;
	}

	return (
		<Card
			className="p-8 mb-8 transition-all duration-300 hover:shadow-xl"
			style={{
				background: "linear-gradient(135deg, #FFFFFF 0%, #F7F9F9 100%)",
				border: "1px solid rgba(0, 133, 111, 0.12)",
				borderRadius: "16px",
				boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
			}}
			data-testid="section-overall-health-summary"
		>
			<h2
				className="mb-4"
				style={{
					fontSize: "28px",
					fontWeight: 700,
					color: "#00453A",
					letterSpacing: "-0.02em",
				}}
			>
				Overall Health Summary
			</h2>
			{isLoading ? (
				<div className="flex items-center gap-2">
					<Loader2
						className="h-5 w-5 animate-spin"
						style={{ color: "#546E7A" }}
					/>
					<p style={{ fontSize: "16px", color: "#546E7A" }}>
						Loading summary...
					</p>
				</div>
			) : (
				summary && (
					<p
						style={{
							fontSize: "16px",
							color: "#546E7A",
							lineHeight: "26px",
						}}
					>
						{summary}
					</p>
				)
			)}
		</Card>
	);
}
