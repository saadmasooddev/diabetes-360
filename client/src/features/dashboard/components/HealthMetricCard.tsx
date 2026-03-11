import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ArrowUp,
	ArrowDown,
	Droplet,
	Activity,
	Heart,
	Footprints,
} from "lucide-react";
import {
	METRIC_TYPE_ENUM,
	type MetricType,
	type HealthMetric,
} from "@shared/schema";
import { useRef } from "react";
import { ButtonSpinner } from "@/components/ui/spinner";

interface HealthMetricCardProps {
	type: MetricType;
	latestValue: string | number | null;
	trendArrow: React.ReactNode;
	title?: string;
	unit?: string;
	onAddLog: () => void;
	onUploadPicture?: (file: File) => void;
	onUpgrade: () => void;
	disabled?: boolean;
	dailyLimit?: number;
	isUploading?: boolean;
	hideUpgradeCallToAction: boolean;
	hideUploadButton?: boolean;
}

export function HealthMetricCard({
	type,
	latestValue,
	trendArrow,
	title: titleOverride,
	onAddLog,
	onUploadPicture,
	onUpgrade,
	disabled = false,
	dailyLimit: remainingLogsLimit = 0,
	isUploading,
	hideUpgradeCallToAction,
	hideUploadButton = false,
	unit: unitOverride,
}: HealthMetricCardProps) {
	const uploadImageRef = useRef<HTMLInputElement | null>(null);
	const config = {
		[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: {
			title: "Current Glucose",
			unit: "mg/dL",
			showUploadButton: true,
			icon: Activity,
			gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
			iconColor: "#4CAF50",
			borderColor: "#4CAF50",
		},
		[METRIC_TYPE_ENUM.STEPS]: {
			title: "Steps Walked",
			unit: "steps",
			showUploadButton: false,
			icon: Footprints,
			gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
			iconColor: "#2196F3",
			borderColor: "#2196F3",
		},
		[METRIC_TYPE_ENUM.WATER_INTAKE]: {
			title: "Water Intake",
			unit: "L",
			showUploadButton: false,
			icon: Droplet,
			gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
			iconColor: "#00856F",
			borderColor: "#00856F",
		},
		[METRIC_TYPE_ENUM.HEART_RATE]: {
			title: "Heart Rate",
			unit: "bpm",
			showUploadButton: false,
			icon: Heart,
			gradient: "linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
			iconColor: "#E91E63",
			borderColor: "#E91E63",
		},
	};

	const metricConfig = config[type];
	const IconComponent = metricConfig.icon;
	const displayTitle = titleOverride ?? metricConfig.title;
	const displayUnit = unitOverride ?? metricConfig.unit;
	const showUploadButton = !hideUploadButton && metricConfig.showUploadButton;

	const formatValue = () => {
		if (latestValue === null || latestValue === undefined) return "—";
		if (type === METRIC_TYPE_ENUM.STEPS) {
			const numValue =
				typeof latestValue === "number"
					? latestValue
					: parseFloat(latestValue.toString());
			return Math.round(numValue).toLocaleString();
		}
		if (type === METRIC_TYPE_ENUM.WATER_INTAKE) {
			const numValue =
				typeof latestValue === "number"
					? latestValue
					: parseFloat(latestValue.toString());
			return numValue.toFixed(1);
		}
		if (type === METRIC_TYPE_ENUM.HEART_RATE) {
			const numValue =
				typeof latestValue === "number"
					? latestValue
					: parseFloat(latestValue.toString());
			return Math.round(numValue).toString();
		}
		return latestValue.toString();
	};

	return (
		<Card
			className=" overflow-hidden transition-all duration-300 hover:shadow-lg"
			style={{
				background: "#FFFFFF",
				border: `1px solid ${metricConfig.borderColor}20`,
				borderRadius: "16px",
				padding: 0,
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
			}}
			data-testid={`card-${type}`}
		>
			{/* Header with gradient background */}
			<div
				style={{
					background: metricConfig.gradient,
					padding: "20px 24px",
					borderBottom: `2px solid ${metricConfig.borderColor}30`,
				}}
			>
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-3">
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
						<h3
							className="font-semibold"
							style={{
								color: "#00453A",
								fontSize: "16px",
								lineHeight: "20px",
								fontWeight: 600,
							}}
						>
							{displayTitle}
						</h3>
					</div>
				</div>

				{/* Value display */}
				<div className="flex items-baseline gap-2">
					<span
						style={{
							fontSize: "36px",
							fontWeight: 700,
							color: "#00453A",
							lineHeight: "42px",
						}}
					>
						{formatValue()}
					</span>
					<span
						style={{
							fontSize: "14px",
							fontWeight: 500,
							color: "#546E7A",
							marginBottom: "4px",
						}}
					>
						{displayUnit}
					</span>
					{trendArrow}
				</div>
			</div>

			{/* Content section */}
			<div style={{ padding: "20px 24px" }}>
				<div className="flex flex-wrap gap-2 mb-3">
					<Button
						variant="outline"
						onClick={onAddLog}
						disabled={disabled}
						className="min-w-0 flex-1 sm:flex-none w-full transition-all duration-200 hover:scale-105"
						style={{
							background: disabled ? "#F5F5F5" : "#00856F",
							border: "none",
							borderRadius: "10px",
							color: disabled ? "#9E9E9E" : "#FFFFFF",
							fontSize: "14px",
							fontWeight: 600,
							padding: "12px 20px",
							cursor: disabled ? "not-allowed" : "pointer",
							opacity: disabled ? 0.6 : 1,
							boxShadow: disabled ? "none" : "0 2px 4px rgba(0, 133, 111, 0.2)",
						}}
						data-testid={`button-add-${type}-log`}
					>
						Add New Log
					</Button>
					{showUploadButton && (
						<>
							<Button
								variant="outline"
								disabled={disabled}
								onClick={() => uploadImageRef?.current?.click?.()}
								className="min-w-0 flex-1 sm:flex-none w-full transition-all duration-200 hover:scale-105"
								style={{
									background: disabled ? "#F5F5F5" : "#FFFFFF",
									border: `1.5px solid ${metricConfig.borderColor}`,
									borderRadius: "10px",
									color: disabled ? "#9E9E9E" : metricConfig.borderColor,
									fontSize: "14px",
									fontWeight: 600,
									padding: "12px 20px",
									cursor: disabled ? "not-allowed" : "pointer",
									opacity: disabled ? 0.6 : 1,
								}}
								data-testid={`button-upload-picture-${type}`}
							>
								{isUploading ? <ButtonSpinner /> : "Upload Picture"}
							</Button>
							<input
								ref={uploadImageRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										onUploadPicture?.(file);
										e.target.value = "";
									}
								}}
							/>
						</>
					)}
				</div>
				{type !== METRIC_TYPE_ENUM.HEART_RATE && remainingLogsLimit > 0 && (
					<p
						className="text-xs leading-relaxed"
						style={{
							color: "#546E7A",
							fontSize: "11px",
							lineHeight: "16px",
							paddingTop: "8px",
							borderTop: "1px solid rgba(0, 0, 0, 0.06)",
						}}
					>
						*You have {remainingLogsLimit} log
						{remainingLogsLimit !== 1 ? "s" : ""} left for today.{" "}
						{!hideUpgradeCallToAction && (
							<button
								onClick={onUpgrade}
								className="transition-colors duration-200 hover:underline"
								style={{
									color: "#00856F",
									fontWeight: 600,
									cursor: "pointer",
									background: "none",
									border: "none",
									padding: 0,
								}}
								data-testid={`link-upgrade-${type}`}
							>
								Upgrade to Paid Plan
							</button>
						)}
					</p>
				)}
			</div>
		</Card>
	);
}
