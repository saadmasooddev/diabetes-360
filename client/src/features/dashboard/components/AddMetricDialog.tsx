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
import {
	METRIC_TYPE_ENUM,
	BLOOD_SUGAR_READING_TYPES_ENUM,
	type MetricType,
	BloodSugarReadingTypeEnumValues,
} from "@shared/schema";

const GLUCOSE_READING_TYPE_LABELS: Record<BloodSugarReadingTypeEnumValues, string> = {
	[BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL]: "Current Glucose",
	[BLOOD_SUGAR_READING_TYPES_ENUM.FASTING]: "Fasting Sugar",
	[BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM]: "Random Sugar",
	[BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C]: "HbA1c"
};

interface AddMetricDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	metricType: MetricType;
	value: string;
	onValueChange: (value: string) => void;
	bloodSugarReadingType?: BloodSugarReadingTypeEnumValues
	onBloodSugarReadingTypeChange?: (
		type: BloodSugarReadingTypeEnumValues,
	) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}

const GLUCOSE_READING_OPTIONS: BloodSugarReadingTypeEnumValues[] = [
	BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
	BLOOD_SUGAR_READING_TYPES_ENUM.FASTING,
	BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM,
	BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C
];

export function AddMetricDialog({
	open,
	onOpenChange,
	metricType,
	value,
	onValueChange,
	bloodSugarReadingType = BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
	onBloodSugarReadingTypeChange,
	onSubmit,
	isSubmitting,
}: AddMetricDialogProps) {
	const config = {
		[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: {
			title: "Log Blood Glucose",
			placeholder: `Enter glucose level ${bloodSugarReadingType === BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C ? "(0-100)%" : "(mg/dL)"}`,
			icon: Activity,
			gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
			iconColor: "#4CAF50",
			description: `Record your ${bloodSugarReadingType} blood glucose reading`,
		},
		[METRIC_TYPE_ENUM.STEPS]: {
			title: "Log Steps",
			placeholder: "Enter steps count",
			icon: Footprints,
			gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
			iconColor: "#2196F3",
			description: "Track your daily physical activity",
		},
		[METRIC_TYPE_ENUM.WATER_INTAKE]: {
			title: "Log Water Intake",
			placeholder: "Enter water intake (L)",
			icon: Droplet,
			gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
			iconColor: "#00856F",
			description: "Record your daily hydration",
		},
		[METRIC_TYPE_ENUM.HEART_RATE]: {
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
					{metricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE &&
						onBloodSugarReadingTypeChange && (
							<div className="space-y-3">
								<Label
									style={{
										color: "#00453A",
										fontSize: "14px",
										fontWeight: 600,
										display: "block",
									}}
								>
									Reading Type
								</Label>
								<div className="flex flex-wrap gap-2">
									{GLUCOSE_READING_OPTIONS.map((option) => (
										<Button
											key={option}
											type="button"
											variant={bloodSugarReadingType === option ? "default" : "outline"}
											size="sm"
											onClick={() =>
												onBloodSugarReadingTypeChange(
													option
												)
											}
											style={{
												background:
													bloodSugarReadingType === option
														? "linear-gradient(135deg, #00856F 0%, #006B5C 100%)"
														: undefined,
												borderColor:
													bloodSugarReadingType === option
														? "#00856F"
														: "rgba(0, 133, 111, 0.3)",
												borderRadius: "8px",
											}}
										>
											{GLUCOSE_READING_TYPE_LABELS[option] ?? option}
										</Button>
									))}
								</div>
							</div>
						)}
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
