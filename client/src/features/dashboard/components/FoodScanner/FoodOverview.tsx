import { Card } from "@/components/ui/card";
import type { ScanResult } from "@/mocks/scanResults";

interface FoodOverviewProps {
	scanResult: ScanResult | null;
	previewUrl: string | null;
}

export function FoodOverview({ scanResult, previewUrl }: FoodOverviewProps) {
	return (
		<Card
			className="p-6"
			style={{
				background: "#FFFFFF",
				borderRadius: "16px",
				border: "1px solid rgba(0, 0, 0, 0.1)",
			}}
			data-testid="card-food-overview"
		>
			<h3
				style={{
					fontSize: "20px",
					fontWeight: 700,
					color: "#00453A",
					marginBottom: "20px",
				}}
			>
				Food Overview
			</h3>
			<div className="flex gap-6">
				<img
					src={
						previewUrl ||
						"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop"
					}
					alt="Food"
					className="w-28 h-28 rounded-full object-cover"
					data-testid="img-food-overview"
				/>
				<div className="flex flex-col justify-center gap-4">
					<div>
						<p
							style={{
								fontSize: "12px",
								fontWeight: 500,
								color: "#546E7A",
								marginBottom: "4px",
							}}
						>
							Food Name
						</p>
						<p
							style={{
								fontSize: "14px",
								fontWeight: 600,
								color: "#00856F",
							}}
							data-testid="text-food-name"
						>
							{scanResult?.foodName || "Loading..."}
						</p>
					</div>
					<div>
						<p
							style={{
								fontSize: "12px",
								fontWeight: 500,
								color: "#546E7A",
								marginBottom: "4px",
							}}
						>
							Food Category
						</p>
						<p
							style={{
								fontSize: "14px",
								fontWeight: 600,
								color: "#00453A",
							}}
							data-testid="text-food-category"
						>
							{scanResult?.foodCategory || "Loading..."}
						</p>
					</div>
				</div>
			</div>
		</Card>
	);
}
