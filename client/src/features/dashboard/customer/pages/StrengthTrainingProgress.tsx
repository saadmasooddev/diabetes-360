import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useCaloriesByActivityType } from "@/hooks/mutations/useHealth";
import type { ChartData } from "server/src/modules/health/repository/health.repository";
import { HealthTrendChart } from "../../components/HealthTrendChart";

type FilterType = "day" | "week" | "month" | "custom";

export function StrengthTrainingProgress() {
	const [, setLocation] = useLocation();
	const [filterType, setFilterType] = useState<FilterType>("day");
	const [customStartDate, setCustomStartDate] = useState<string>("");
	const [customEndDate, setCustomEndDate] = useState<string>("");

	const { startDate, endDate } = useMemo(() => {
		const end = new Date();
		end.setHours(23, 59, 59, 999);

		const start = new Date();

		if (filterType === "day") {
		} else if (filterType === "week") {
			start.setDate(start.getDate() - 7);
			start.setHours(0, 0, 0, 0);
		} else if (filterType === "month") {
			start.setMonth(start.getMonth() - 1);
			start.setHours(0, 0, 0, 0);
		} else if (filterType === "custom") {
			if (customStartDate && customEndDate) {
				const customStart = new Date(customStartDate);
				const customEnd = new Date(customEndDate);
				customStart.setHours(0, 0, 0, 0);
				customEnd.setHours(23, 59, 59, 999);
				return {
					startDate: customStart.toISOString().split("T")[0],
					endDate: customEnd.toISOString().split("T")[0],
				};
			}
			// Default to today if custom dates not set
			start.setHours(0, 0, 0, 0);
		}

		return {
			startDate: start.toISOString().split("T")[0],
			endDate: end.toISOString().split("T")[0],
		};
	}, [filterType, customStartDate, customEndDate]);

	const { data: caloriesData, isLoading } = useCaloriesByActivityType(
		startDate,
		endDate,
	);

	const handleBack = () => {
		setLocation(ROUTES.TIPS_EXERCISES);
	};

	// Format chart data for HealthTrendChart (expects { time: string, value: number })
	const formatChartData = (data: Array<ChartData>) => {
		if (!data || data.length === 0) return [];

		const isToday =
			filterType === "day" &&
			startDate === new Date().toISOString().split("T")[0];

		return data.map((item) => {
			// Handle recordedAt - it might be a Date object or a string
			const recordedAtDate =
				item.recordedAt instanceof Date
					? item.recordedAt
					: new Date(item.recordedAt);

			let time: string;

			if (isToday) {
				// Show time for today
				time = recordedAtDate.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
				});
			} else {
				// Show date for date ranges
				if (
					filterType === "week" ||
					filterType === "month" ||
					filterType === "custom"
				) {
					time = recordedAtDate.toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
					});
				} else {
					time = recordedAtDate.toLocaleDateString("en-US", {
						weekday: "short",
					});
				}
			}

			return {
				time,
				value: item.value,
			};
		});
	};

	const cardioChartData = formatChartData(caloriesData?.chartData.cardio || []);
	const strengthChartData = formatChartData(
		caloriesData?.chartData.strength_training || [],
	);
	const stretchingChartData = formatChartData(
		caloriesData?.chartData.stretching || [],
	);

	const totals = caloriesData?.totals || {
		cardio: 0,
		strength_training: 0,
		stretching: 0,
		total: 0,
	};

	// Get max value for Y-axis domain
	const getMaxValue = (data: typeof cardioChartData) => {
		if (data.length === 0) return 100;
		const max = Math.max(...data.map((d) => d.value));
		return Math.ceil(max * 1.1);
	};

	const maxCardio = getMaxValue(cardioChartData);
	const maxStrength = getMaxValue(strengthChartData);
	const maxStretching = getMaxValue(stretchingChartData);

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
				<div className="w-full max-w-[1200px] mx-auto">
					{/* Header */}
					<div className="flex items-center gap-4 mb-8">
						<button
							onClick={handleBack}
							className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-colors"
							aria-label="Go back"
							data-testid="button-back"
						>
							<ArrowLeft size={20} color="#00856F" />
						</button>
						<h1
							style={{
								fontSize: "32px",
								fontWeight: 700,
								color: "#00856F",
							}}
							data-testid="text-page-title"
						>
							Strength Training Progress
						</h1>
					</div>

					{/* Filter Tabs */}
					<div className="mb-6">
						<div className="flex flex-wrap gap-4 mb-4">
							{(["day", "week", "month", "custom"] as FilterType[]).map(
								(filter) => (
									<Button
										key={filter}
										onClick={() => setFilterType(filter)}
										variant="ghost"
										className={`px-6 py-2 rounded-lg transition-colors ${
											filterType === filter
												? "bg-teal-50 text-teal-700"
												: "text-gray-600 hover:bg-gray-100"
										}`}
										style={{
											fontWeight: filterType === filter ? 600 : 400,
											fontSize: "14px",
											textTransform: "capitalize",
										}}
										data-testid={`button-filter-${filter}`}
									>
										{filter === "custom"
											? "Custom"
											: filter === "day"
												? "Day"
												: filter === "week"
													? "Week"
													: "Month"}
									</Button>
								),
							)}
						</div>

						{/* Custom Date Inputs */}
						{filterType === "custom" && (
							<div className="flex gap-4 items-end">
								<div className="flex-1">
									<label
										htmlFor="start-date"
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#00856F",
											marginBottom: "8px",
											display: "block",
										}}
									>
										Start Date
									</label>
									<input
										id="start-date"
										type="date"
										value={customStartDate}
										onChange={(e) => setCustomStartDate(e.target.value)}
										className="w-full px-4 py-2 rounded-lg border"
										style={{
											background: "#FFFFFF",
											border: "1px solid rgba(0, 0, 0, 0.1)",
											fontSize: "14px",
											color: "#00453A",
										}}
										data-testid="input-start-date"
									/>
								</div>
								<div className="flex-1">
									<label
										htmlFor="end-date"
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#00856F",
											marginBottom: "8px",
											display: "block",
										}}
									>
										End Date
									</label>
									<input
										id="end-date"
										type="date"
										value={customEndDate}
										onChange={(e) => setCustomEndDate(e.target.value)}
										className="w-full px-4 py-2 rounded-lg border"
										style={{
											background: "#FFFFFF",
											border: "1px solid rgba(0, 0, 0, 0.1)",
											fontSize: "14px",
											color: "#00453A",
										}}
										data-testid="input-end-date"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Calories Summary Card */}
					<Card
						className="p-6 mb-8"
						style={{
							background: "#FFFFFF",
							borderRadius: "12px",
							border: "1px solid rgba(0, 0, 0, 0.1)",
						}}
						data-testid="card-calories-summary"
					>
						<h2
							className="mb-6"
							style={{
								fontSize: "20px",
								fontWeight: 700,
								color: "#00856F",
							}}
						>
							Calories Burnt
						</h2>

						{isLoading ? (
							<div className="flex items-center justify-center py-8 text-gray-500">
								Loading...
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								<div>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#546E7A",
											marginBottom: "8px",
										}}
									>
										Cardio
									</div>
									<div
										style={{
											fontSize: "32px",
											fontWeight: 700,
											color: "#00856F",
										}}
										data-testid="text-calories-cardio"
									>
										{totals.cardio}
									</div>
								</div>
								<div>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#546E7A",
											marginBottom: "8px",
										}}
									>
										Strength Training
									</div>
									<div
										style={{
											fontSize: "32px",
											fontWeight: 700,
											color: "#00856F",
										}}
										data-testid="text-calories-strength"
									>
										{totals.strength_training}
									</div>
								</div>
								<div>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#546E7A",
											marginBottom: "8px",
										}}
									>
										Stretching
									</div>
									<div
										style={{
											fontSize: "32px",
											fontWeight: 700,
											color: "#00856F",
										}}
										data-testid="text-calories-stretching"
									>
										{totals.stretching}
									</div>
								</div>
								<div>
									<div
										style={{
											fontSize: "14px",
											fontWeight: 600,
											color: "#546E7A",
											marginBottom: "8px",
										}}
									>
										Total
									</div>
									<div
										style={{
											fontSize: "32px",
											fontWeight: 700,
											color: "#00453A",
										}}
										data-testid="text-calories-total"
									>
										{totals.total}
									</div>
								</div>
							</div>
						)}
					</Card>

					{/* Charts */}
					<div className="space-y-6">
						{/* Cardio Chart */}
						{isLoading ? (
							<Card
								className="p-8"
								style={{
									background: "#FFFFFF",
									borderRadius: "16px",
									border: "1px solid rgba(0, 133, 111, 0.12)",
								}}
								data-testid="card-chart-cardio"
							>
								<div className="flex items-center justify-center h-[300px] text-gray-500">
									Loading chart data...
								</div>
							</Card>
						) : (
							<HealthTrendChart
								title="Cardio"
								data={cardioChartData}
								gradientId="cardioGradient"
								testId="card-chart-cardio"
								height={300}
								yAxisConfig={{
									domain: [0, maxCardio],
								}}
								color="#EF5350"
							/>
						)}

						{/* Strength Training Chart */}
						{isLoading ? (
							<Card
								className="p-8"
								style={{
									background: "#FFFFFF",
									borderRadius: "16px",
									border: "1px solid rgba(0, 133, 111, 0.12)",
								}}
								data-testid="card-chart-strength"
							>
								<div className="flex items-center justify-center h-[300px] text-gray-500">
									Loading chart data...
								</div>
							</Card>
						) : (
							<HealthTrendChart
								title="Strength Training"
								data={strengthChartData}
								gradientId="strengthGradient"
								testId="card-chart-strength"
								height={300}
								yAxisConfig={{
									domain: [0, maxStrength],
								}}
								color="#00856F"
							/>
						)}

						{/* Stretching Chart */}
						{isLoading ? (
							<Card
								className="p-8"
								style={{
									background: "#FFFFFF",
									borderRadius: "16px",
									border: "1px solid rgba(0, 133, 111, 0.12)",
								}}
								data-testid="card-chart-stretching"
							>
								<div className="flex items-center justify-center h-[300px] text-gray-500">
									Loading chart data...
								</div>
							</Card>
						) : (
							<HealthTrendChart
								title="Stretching"
								data={stretchingChartData}
								gradientId="stretchingGradient"
								testId="card-chart-stretching"
								height={300}
								yAxisConfig={{
									domain: [0, maxStretching],
								}}
								color="#9C27B0"
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
