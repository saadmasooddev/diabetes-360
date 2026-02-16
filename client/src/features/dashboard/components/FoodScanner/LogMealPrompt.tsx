import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, X } from "lucide-react";
import type { ScanResult } from "@/mocks/scanResults";
import { useLogMeal } from "@/hooks/mutations/useFoodScanner";

interface LogMealPromptProps {
	scanResult: ScanResult | null;
	onLogged?: () => void;
	onDismiss?: () => void;
}

export function LogMealPrompt({
	scanResult,
	onLogged,
	onDismiss,
}: LogMealPromptProps) {
	const [isDismissed, setIsDismissed] = useState(false);
	const logMealMutation = useLogMeal();

	if (!scanResult || isDismissed) {
		return null;
	}

	const handleLogMeal = async () => {
		if (!scanResult) return;

		const breakdown = scanResult.breakdown;
		logMealMutation.mutate(
			{
				foodName: scanResult.foodName,
				carbs: Math.max(0, Number(breakdown.carbs.value)),
				sugars: Number(breakdown.sugars.value),
				fibres: Number(breakdown.fiber.value),
				proteins: Number(breakdown.protein.value),
				fats: Number(breakdown.fat.value),
				calories: Number(breakdown.calories.value),
			},
			{
				onSuccess: () => {
					onLogged?.();
				},
			},
		);
	};

	const handleDismiss = () => {
		setIsDismissed(true);
		onDismiss?.();
	};

	return (
		<Card
			className="p-4 mb-6 animate-in slide-in-from-top-2 duration-300"
			style={{
				background: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
				borderRadius: "12px",
				border: "1px solid rgba(0, 133, 111, 0.2)",
			}}
			data-testid="card-log-meal-prompt"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						<CheckCircle2 className="h-5 w-5 text-[#00856F]" />
						<h4
							style={{
								fontSize: "16px",
								fontWeight: 600,
								color: "#00453A",
							}}
						>
							Log this meal?
						</h4>
					</div>
					<p
						style={{
							fontSize: "13px",
							fontWeight: 400,
							color: "#546E7A",
							marginBottom: "12px",
						}}
					>
						Would you like to log this meal to track your daily calories and
						nutrients?
					</p>
					<div className="flex items-center gap-2">
						<Button
							onClick={handleLogMeal}
							disabled={logMealMutation.isPending}
							style={{
								background: "#00856F",
								color: "#FFFFFF",
								fontSize: "13px",
								fontWeight: 500,
								padding: "6px 16px",
								borderRadius: "8px",
							}}
							data-testid="button-log-meal"
						>
							{logMealMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Logging...
								</>
							) : (
								"Log Meal"
							)}
						</Button>
						<Button
							onClick={handleDismiss}
							disabled={logMealMutation.isPending}
							variant="ghost"
							style={{
								fontSize: "13px",
								fontWeight: 500,
								color: "#546E7A",
								padding: "6px 12px",
							}}
							data-testid="button-dismiss"
						>
							Maybe later
						</Button>
					</div>
				</div>
				<button
					onClick={handleDismiss}
					disabled={logMealMutation.isPending}
					className="flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition-colors"
					style={{ color: "#546E7A" }}
					data-testid="button-close"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		</Card>
	);
}
