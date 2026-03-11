import { TrendingUp } from "lucide-react";
import { METRIC_TYPE_ENUM, type MetricType } from "@shared/schema";

interface CircularGaugeProps {
	value: number;
	label: string;
	unit: string;
	size?: number;
	metricType: MetricType;
	recommendedTarget?: number;
	userTarget?: number;
}

export function CircularGauge({
	value,
	label,
	unit,
	size = 160,
	metricType,
	recommendedTarget,
	userTarget,
}: CircularGaugeProps) {
	const maxValue = userTarget || recommendedTarget || value || 1;
	const percentage = Math.min((value / maxValue) * 100, 100);
	const radius = size * 0.45; // 35% of size to leave padding
	const strokeWidth = size * 0.25; // 8% of size for a more prominent stroke
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	// Get gradient colors based on metric type
	const getGradientColors = () => {
		switch (metricType) {
			case METRIC_TYPE_ENUM.BLOOD_GLUCOSE:
				return {
					start: "#4CAF50",
					end: "#66BB6A",
					bg: "rgba(76, 175, 80, 0.1)",
					shadow: "rgba(76, 175, 80, 0.3)",
				};
			case METRIC_TYPE_ENUM.WATER_INTAKE:
				return {
					start: "#00856F",
					end: "#00A085",
					bg: "rgba(0, 133, 111, 0.1)",
					shadow: "rgba(0, 133, 111, 0.3)",
				};
			case METRIC_TYPE_ENUM.STEPS:
				return {
					start: "#2196F3",
					end: "#42A5F5",
					bg: "rgba(33, 150, 243, 0.1)",
					shadow: "rgba(33, 150, 243, 0.3)",
				};
			case METRIC_TYPE_ENUM.HEART_RATE:
				return {
					start: "#E91E63",
					end: "#EC407A",
					bg: "rgba(233, 30, 99, 0.1)",
					shadow: "rgba(233, 30, 99, 0.3)",
				};
			default:
				return {
					start: "#00856F",
					end: "#00A085",
					bg: "rgba(0, 133, 111, 0.1)",
					shadow: "rgba(0, 133, 111, 0.3)",
				};
		}
	};

	const colors = getGradientColors();
	const gradientId = `gauge-gradient-${metricType}-${label.toLowerCase().replace(/\s/g, "-")}`;

	// Show "exceeded target" only when a target exists and value is greater than it
	const effectiveTarget = userTarget ?? recommendedTarget;
	const hasExceededTarget =
		effectiveTarget != null &&
		typeof effectiveTarget === "number" &&
		!Number.isNaN(effectiveTarget) &&
		value > effectiveTarget;

	const testId = metricType
		? `gauge-${metricType}-${label.toLowerCase().replace(/\s/g, "-")}`
		: `gauge-${label.toLowerCase().replace(/\s/g, "-")}`;

	return (
		<div
			className="flex flex-col items-center justify-center"
			data-testid={testId}
			style={{
				width: "100%",
				padding: "16px",
				boxSizing: "border-box",
			}}
		>
			<div
				className="relative flex items-center justify-center"
				style={{
					width: size,
					height: size,
					flexShrink: 0,
					filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
				}}
			>
				{/* Outer glow effect */}
				<div
					className="absolute inset-0 rounded-full"
					style={{
						background: `radial-gradient(circle, ${colors.bg} 0%, transparent 70%)`,
						transform: "scale(1.15)",
						zIndex: 0,
					}}
				/>

				<svg
					className="transform -rotate-90 relative z-10"
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					style={{
						overflow: "visible",
						display: "block",
					}}
				>
					<defs>
						<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stopColor={colors.start} stopOpacity="1" />
							<stop offset="100%" stopColor={colors.end} stopOpacity="1" />
						</linearGradient>
						{/* Shadow filter for depth */}
						<filter
							id={`shadow-${gradientId}`}
							x="-50%"
							y="-50%"
							width="200%"
							height="200%"
						>
							<feGaussianBlur in="SourceAlpha" stdDeviation="3" />
							<feOffset dx="0" dy="2" result="offsetblur" />
							<feComponentTransfer>
								<feFuncA type="linear" slope="0.3" />
							</feComponentTransfer>
							<feMerge>
								<feMergeNode />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* Background circle with subtle gradient */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={colors.bg}
						strokeWidth={strokeWidth}
						style={{
							filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))",
						}}
					/>

					{/* Progress circle with gradient */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={`url(#${gradientId})`}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						style={{
							transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
							filter: `drop-shadow(0 2px 8px ${colors.shadow})`,
						}}
					/>
				</svg>

				{/* Center content with enhanced styling */}
				<div
					className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
					style={{
						textShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
					}}
				>
					<span
						style={{
							fontSize: size * 0.14,
							fontWeight: 800,
							color: "#00453A",
							lineHeight: 1.2,
							letterSpacing: "-0.02em",
						}}
					>
						{value.toFixed(value % 1 === 0 ? 0 : 1)}
						<span
							style={{ fontSize: size * 0.08, fontWeight: 600, opacity: 0.7 }}
						>
							{unit}
						</span>
					</span>
					{(recommendedTarget || userTarget) && (
						<span
							style={{
								fontSize: size * 0.07,
								fontWeight: 500,
								color: "#546E7A",
								marginTop: "6px",
								opacity: 0.8,
							}}
						>
							Target: {userTarget || recommendedTarget}
							{unit}
						</span>
					)}
				</div>
			</div>

			{/* Label with enhanced styling */}
			<p
				className="mt-4 text-center"
				style={{
					fontSize: "16px",
					fontWeight: 700,
					color: "#00453A",
					letterSpacing: "0.01em",
				}}
			>
				{label}
			</p>

			{/* Exceeded target indicator - only when target exists and value > target */}
			{hasExceededTarget && (
				<div
					className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
					style={{
						background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
						border: "1px solid rgba(76, 175, 80, 0.35)",
						fontSize: "12px",
						fontWeight: 600,
						color: "#2E7D32",
						letterSpacing: "0.02em",
						boxShadow: "0 1px 3px rgba(76, 175, 80, 0.15)",
					}}
					data-testid={`${testId}-exceeded-target`}
				>
					<TrendingUp size={14} strokeWidth={2.5} />
					<span>
						Target exceeded by {value - effectiveTarget} {unit}
					</span>
				</div>
			)}
		</div>
	);
}
