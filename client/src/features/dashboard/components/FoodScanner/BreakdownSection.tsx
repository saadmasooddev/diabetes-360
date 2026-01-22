import { Card } from "@/components/ui/card";
import { EnhancedNutritionProgressBar } from "./EnhancedNutritionProgressBar";
import type { ScanResult } from "@/mocks/scanResults";
import type {
	DailyUserData,
	ConsumedNutrients,
} from "@/services/foodScannerService";

interface BreakdownSectionProps {
	scanResult: ScanResult | null;
	nutritionRequirements?: DailyUserData;
	consumedNutrients?: ConsumedNutrients | null;
}

export function BreakdownSection({
	scanResult,
	nutritionRequirements,
	consumedNutrients,
}: BreakdownSectionProps) {
	return (
		<Card
			className="p-6"
			style={{
				background: "#FFFFFF",
				borderRadius: "16px",
				border: "1px solid rgba(0, 0, 0, 0.1)",
			}}
			data-testid="card-breakdown"
		>
			<h3
				style={{
					fontSize: "20px",
					fontWeight: 700,
					color: "#00453A",
					marginBottom: "20px",
				}}
			>
				Nutritional Breakdown
			</h3>

			{scanResult ? (
				<>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.carbs}
						recommended={nutritionRequirements?.carbs}
						consumed={consumedNutrients?.carbs}
						unit="g"
					/>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.fiber}
						recommended={nutritionRequirements?.fiber}
						consumed={consumedNutrients?.fiber}
						unit="g"
					/>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.sugars}
						recommended={nutritionRequirements?.sugars}
						consumed={consumedNutrients?.sugars}
						unit="g"
					/>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.protein}
						recommended={nutritionRequirements?.protein}
						consumed={consumedNutrients?.protein}
						unit="g"
					/>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.fat}
						recommended={nutritionRequirements?.fat}
						consumed={consumedNutrients?.fat}
						unit="g"
					/>
					<EnhancedNutritionProgressBar
						item={scanResult.breakdown.calories}
						recommended={nutritionRequirements?.calories}
						consumed={consumedNutrients?.calories}
						unit="kcal"
					/>
				</>
			) : (
				<p>Loading breakdown...</p>
			)}
		</Card>
	);
}
