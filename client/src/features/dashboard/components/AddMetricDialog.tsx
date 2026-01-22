import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { handleNumberInput } from "@/lib/utils";
import { Activity, Footprints, Droplet, Heart } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/spinner";
import { EXERCISE_TYPE_ENUM, type MetricType } from "@shared/schema";

interface AddMetricDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	metricType: MetricType;
	value: string;
	onValueChange: (value: string) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}

export function AddMetricDialog({
	open,
	onOpenChange,
	metricType,
	value,
	onValueChange,
	onSubmit,
	isSubmitting,
}: AddMetricDialogProps) {
	const config = {
		[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE]: {
			title: "Log Blood Glucose",
			placeholder: "Enter glucose level (mg/dL)",
			icon: Activity,
			gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
			iconColor: "#4CAF50",
			description: "Record your current blood glucose reading",
		},
		[EXERCISE_TYPE_ENUM.STEPS]: {
			title: "Log Steps",
			placeholder: "Enter steps count",
			icon: Footprints,
			gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
			iconColor: "#2196F3",
			description: "Track your daily physical activity",
		},
		[EXERCISE_TYPE_ENUM.WATER_INTAKE]: {
			title: "Log Water Intake",
			placeholder: "Enter water intake (L)",
			icon: Droplet,
			gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
			iconColor: "#00856F",
			description: "Record your daily hydration",
		},
		[EXERCISE_TYPE_ENUM.HEART_RATE]: {
			title: "Log Heart Rate",
			placeholder: "Enter heart rate (bpm)",
			icon: Heart,
			gradient: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
			iconColor: "#E91E63",
			description: "Monitor your cardiovascular health",
		},
	};

	const metricConfig = config[metricType];
	const IconComponent = metricConfig.icon;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md overflow-hidden"
				style={{
					background: "#FFFFFF",
					borderRadius: "16px",
					padding: 0,
					border: "1px solid rgba(0, 133, 111, 0.12)",
					boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
				}}
			>
				{/* Header with gradient */}
				<div
					style={{
						background: metricConfig.gradient,
						padding: "24px 28px",
						borderBottom: `2px solid ${metricConfig.iconColor}30`,
					}}
				>
					<DialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div
								style={{
									background: "#FFFFFF",
									borderRadius: "12px",
									padding: "10px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
								}}
							>
								<IconComponent
									size={24}
									style={{ color: metricConfig.iconColor }}
								/>
							</div>
							<DialogTitle
								style={{
									color: "#00453A",
									fontSize: "22px",
									fontWeight: 700,
									margin: 0,
								}}
							>
								{metricConfig.title}
							</DialogTitle>
						</div>
						<DialogDescription
							style={{
								color: "#546E7A",
								fontSize: "14px",
								marginTop: "4px",
							}}
						>
							{metricConfig.description}
						</DialogDescription>
					</DialogHeader>
				</div>

				{/* Content */}
				<div className="space-y-6 p-6">
					<div className="space-y-3">
						<Label
							htmlFor="metric-value"
							style={{
								color: "#00453A",
								fontSize: "14px",
								fontWeight: 600,
								display: "block",
							}}
						>
							Enter Value
						</Label>
						<Input
							id="metric-value"
							type="text"
							inputMode="decimal"
							placeholder={metricConfig.placeholder}
							value={value}
							onChange={(e) => {
								const sanitized = handleNumberInput(value, e.target.value);
								onValueChange(sanitized);
							}}
							className="transition-all duration-200 focus:border-[#00856F] focus:ring-2 focus:ring-[#00856F]/20"
							style={{
								border: "1.5px solid rgba(0, 133, 111, 0.2)",
								borderRadius: "10px",
								padding: "14px 16px",
								fontSize: "16px",
								fontWeight: 500,
								background: "#FAFAFA",
							}}
							data-testid="input-metric-value"
						/>
					</div>
					<Button
						onClick={onSubmit}
						disabled={isSubmitting || !value}
						className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
						style={{
							background: "linear-gradient(135deg, #00856F 0%, #006B5C 100%)",
							color: "#FFFFFF",
							borderRadius: "12px",
							fontSize: "16px",
							fontWeight: 600,
							padding: "14px",
							border: "none",
							boxShadow: "0 4px 12px rgba(0, 133, 111, 0.3)",
						}}
						data-testid="button-log-now"
					>
						{isSubmitting ? (
							<>
								<ButtonSpinner className="mr-2" />
								Logging...
							</>
						) : (
							"Log Now"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
