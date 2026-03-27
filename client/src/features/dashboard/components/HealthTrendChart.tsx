import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { API_ENDPOINTS } from "@/config/endpoints";
import { DateManager, METRIC_TYPE_ENUM } from "@shared/schema";
import type { FilteredMetricsKey } from "@/hooks/mutations/useHealth";
import type { MetricType } from "@shared/schema";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
} from "recharts";

interface ChartDataPoint {
	time: string;
	value: number;
}

export type IntervalType = "daily" | "weekly" | "monthly" | "custom";

interface HealthTrendChartProps {
	title: string;
	data: ChartDataPoint[];
	gradientId: string;
	testId: string;
	height?: number;
	yAxisConfig?: {
		domain: [number, number];
		ticks?: number[];
		label?: string;
	};
	interval?: IntervalType;
	onIntervalChange?: (interval: IntervalType) => void;
	recommendedTarget?: number;
	userTarget?: number;
	color?: string;
}

export const formatTimeLabel = (date: Date, interval: IntervalType): string => {
	if (interval === "daily") {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const period = hours >= 12 ? "PM" : "AM";
		const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
		return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""} ${period}`;
	} else if (interval === "weekly") {
		const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		return `${days[date.getDay()]} ${date.getDate()}`;
	} else if (interval === "monthly") {
		// Monthly - show date
		return `${date.getMonth() + 1}/${date.getDate()}`;
	} else {
		return DateManager.formatDate(date);
	}
};

export type DateRange = { startDate: string; endDate: string };
export const getDateRange = (interval: IntervalType, start?: string, end?: string): DateRange => {
	const today = new Date();
	today.setHours(23, 59, 59, 999);
	let endDate = today.toISOString().split("T")[0];

	let startDate = new Date();
	if (interval === "daily") {
		startDate.setHours(0, 0, 0, 0);
	} else if (interval === "weekly") {
		startDate.setDate(today.getDate() - 7);
		startDate.setHours(0, 0, 0, 0);
	} else if (interval === "monthly") {
		startDate.setDate(today.getDate() - 30);
		startDate.setHours(0, 0, 0, 0);
	} else if (interval === "custom" && start && end) {
		startDate = new Date(start)
		endDate = DateManager.formatDate(end)
	}
	return {
		startDate: DateManager.formatDate(startDate),
		endDate: DateManager.formatDate(endDate),
	};
};
export const getFilteredMetricsQueryKeys = (
	metricType: MetricType,
	dateRange: DateRange,
): FilteredMetricsKey => {
	switch (metricType) {
		case METRIC_TYPE_ENUM.BLOOD_GLUCOSE:
			return {
				endpoint: API_ENDPOINTS.HEALTH.FILTERED,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
				types: [METRIC_TYPE_ENUM.BLOOD_GLUCOSE],
			};
		case METRIC_TYPE_ENUM.STEPS:
			return {
				endpoint: API_ENDPOINTS.HEALTH.FILTERED,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
				types: [METRIC_TYPE_ENUM.STEPS],
			};
		case METRIC_TYPE_ENUM.HEART_RATE:
			return {
				endpoint: API_ENDPOINTS.HEALTH.FILTERED,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
				types: [METRIC_TYPE_ENUM.HEART_RATE],
			};
		case METRIC_TYPE_ENUM.CALORIE_INTAKE:
			return {
				endpoint: API_ENDPOINTS.HEALTH.FILTERED,
				startDate: dateRange.startDate,
				endDate: dateRange.endDate,
				types: [METRIC_TYPE_ENUM.CALORIE_INTAKE],
			}
	}
};

export function HealthTrendChart({
	title,
	data,
	gradientId,
	testId,
	height = 250,
	yAxisConfig,
	interval = "daily",
	onIntervalChange,
	recommendedTarget,
	userTarget,
	color = "#00856F",
}: HealthTrendChartProps) {
	const calculateDomain = (): [number, number | string] => {
		if (!yAxisConfig?.domain) {
			// If no domain specified, use auto
			return [0, "auto"];
		}

		const [min, max] = yAxisConfig.domain;

		// Find the maximum value in the data
		const maxDataValue =
			data.length > 0 ? Math.max(...data.map((d) => d.value || 0)) : 0;

		// Consider targets in the max calculation
		const maxTarget = Math.max(recommendedTarget || 0, userTarget || 0);

		// Calculate the actual max needed
		const actualMax = Math.max(maxDataValue, maxTarget, max);

		// If actualMax exceeds the configured max, use actualMax with 10% padding
		if (actualMax > max) {
			return [min, Math.ceil(actualMax * 1.1)];
		}

		// Otherwise use the configured domain
		return [min, max];
	};

	const dynamicDomain = calculateDomain();

	// Prepare data with target values for each point
	const chartData = data.map((point) => ({
		...point,
		recommendedTarget: recommendedTarget,
		userTarget: userTarget,
	}));
	return (
		<Card
			className="transition-all duration-300 hover:shadow-xl"
			style={{
				background: "#FFFFFF",
				border: "1px solid rgba(0, 133, 111, 0.12)",
				borderRadius: "16px",
				padding: "28px",
				boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
			}}
			data-testid={testId}
		>
			<div
				className="flex items-center justify-between mb-6 pb-4 border-b"
				style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
			>
				<h3
					className="font-semibold"
					style={{
						color: "#00453A",
						fontSize: "22px",
						lineHeight: "28px",
						fontWeight: 700,
						letterSpacing: "-0.02em",
					}}
				>
					{title}
				</h3>
				{onIntervalChange && (
					<Select
						value={interval}
						onValueChange={(value) => onIntervalChange(value as IntervalType)}
					>
						<SelectTrigger
							className="w-36 transition-all duration-200 hover:border-[#00856F]"
							style={{
								border: "1.5px solid rgba(0, 133, 111, 0.2)",
								borderRadius: "10px",
								padding: "8px 12px",
							}}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="daily">Daily</SelectItem>
							<SelectItem value="weekly">Weekly</SelectItem>
							<SelectItem value="monthly">Monthly</SelectItem>
						</SelectContent>
					</Select>
				)}
			</div>
			{data.length === 0 ? (
				<div
					className="flex items-center justify-center"
					style={{ height: `${height}px` }}
				>
					<p className="text-gray-500">
						No data available for the selected period
					</p>
				</div>
			) : (
				<ResponsiveContainer width="100%" height={height}>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={color} stopOpacity={0.3} />
								<stop offset="100%" stopColor={color} stopOpacity={0.05} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#E0E0E0"
							vertical={false}
						/>
						<XAxis
							dataKey="time"
							tick={{ fill: "#546E7A", fontSize: 12 }}
							axisLine={{ stroke: "#E0E0E0" }}
							tickLine={false}
						/>
						<YAxis
							tick={{ fill: "#546E7A", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
							domain={dynamicDomain}
							ticks={yAxisConfig?.ticks}
							label={
								yAxisConfig?.label
									? {
										value: yAxisConfig.label,
										position: "insideLeft",
										fill: "#546E7A",
										fontSize: 11,
									}
									: undefined
							}
						/>
						<Tooltip
							contentStyle={{
								background: "#FFFFFF",
								border: "1px solid #E0E0E0",
								borderRadius: "8px",
							}}
						/>
						<Area
							type="monotone"
							dataKey="value"
							stroke={color}
							strokeWidth={2}
							fill={`url(#${gradientId})`}
							name="Current Value"
						/>
						{recommendedTarget !== undefined && recommendedTarget !== null && (
							<ReferenceLine
								y={recommendedTarget}
								stroke="#FF9800"
								strokeWidth={2}
								strokeDasharray="5 5"
								label={{
									value: "Recommended",
									position: "right",
									fill: "#FF9800",
									fontSize: 11,
								}}
							/>
						)}
						{userTarget !== undefined && userTarget !== null && (
							<ReferenceLine
								y={userTarget}
								stroke="#2196F3"
								strokeWidth={2}
								strokeDasharray="5 5"
								label={{
									value: "Your Target",
									position: "right",
									fill: "#2196F3",
									fontSize: 11,
								}}
							/>
						)}
					</AreaChart>
				</ResponsiveContainer>
			)}

			{/* Custom Legend */}
			{(recommendedTarget !== undefined || userTarget !== undefined) && (
				<div
					className="mt-6 pt-4 flex flex-wrap items-center justify-center gap-6"
					style={{
						borderTop: "1px solid rgba(0, 133, 111, 0.1)",
					}}
				>
					<div className="flex items-center gap-2.5">
						<div
							className="w-5 h-1 rounded-full"
							style={{ background: color }}
						></div>
						<span className="text-sm font-medium" style={{ color: "#546E7A" }}>
							Current Progress
						</span>
					</div>
					{recommendedTarget !== undefined && recommendedTarget !== null && (
						<div className="flex items-center gap-2.5">
							<div
								className="w-5 h-1 border-t-2 border-dashed rounded-full"
								style={{ borderColor: "#FF9800" }}
							></div>
							<span
								className="text-sm font-medium"
								style={{ color: "#546E7A" }}
							>
								Recommended Target
							</span>
						</div>
					)}
					{userTarget !== undefined && userTarget !== null && (
						<div className="flex items-center gap-2.5">
							<div
								className="w-5 h-1 border-t-2 border-dashed rounded-full"
								style={{ borderColor: "#2196F3" }}
							></div>
							<span
								className="text-sm font-medium"
								style={{ color: "#546E7A" }}
							>
								Your Target
							</span>
						</div>
					)}
				</div>
			)}
		</Card>
	);
}
