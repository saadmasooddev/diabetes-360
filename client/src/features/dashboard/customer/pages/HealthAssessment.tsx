import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Droplet, Activity, Heart } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
	useAggregatedStatistics,
	useHealthInsights,
} from "@/hooks/mutations/useHealth";
import { CircularGauge } from "../../components/CircularGauge";
import { InsightSummaryCard } from "../../components/InsightSummaryCard";
import { OverallHealthSummary } from "../../components/OverallHealthSummary";
import { WhatToDoNext } from "../../components/WhatToDoNext";
import { EXERCISE_TYPE_ENUM, type MetricType } from "@shared/schema";

export function HealthAssessment() {
	const user = useAuthStore((state) => state.user);
	const isPaidUser = user?.paymentType !== "free" && user?.paymentType;
	const { data: statistics } = useAggregatedStatistics();
	const { data: healthAssessment, isLoading: insightsLoading } =
		useHealthInsights();
	const insights = healthAssessment?.insights || [];

	const waterIntakeInsight =
		insights.find((i) => i.name === EXERCISE_TYPE_ENUM.WATER_INTAKE)?.insight ||
		"";
	const glucoseInsight =
		insights.find((i) => i.name === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE)
			?.insight || "";
	const stepsInsight =
		insights.find((i) => i.name === EXERCISE_TYPE_ENUM.STEPS)?.insight || "";
	const heartRateInsight =
		insights.find((i) => i.name === EXERCISE_TYPE_ENUM.HEART_RATE)?.insight ||
		"";
	const overallHealthSummary = healthAssessment?.overallHealthSummary || "";
	const whatToDoNext = healthAssessment?.whatToDoNext || [];
	// Helper to get target for a metric type
	const getTarget = (metricType: MetricType) => {
		const userTarget = statistics?.targets?.user.find(
			(t) => t.metricType === metricType,
		);
		const recommendedTarget = statistics?.targets?.recommended.find(
			(t) => t.metricType === metricType,
		);
		return {
			user: userTarget ? parseFloat(userTarget.targetValue) : undefined,
			recommended: recommendedTarget
				? parseFloat(recommendedTarget.targetValue)
				: undefined,
		};
	};

	// Use statistics from API or default to 0 if no data
	const glucoseDaily = statistics?.glucose.daily ?? 0;
	const glucoseWeekly = statistics?.glucose.weekly ?? 0;
	const glucoseMonthly = statistics?.glucose.monthly ?? 0;
	const glucoseTargets = getTarget(EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE);

	// Water is in liters already from the API, convert to string with 1 decimal
	const waterDaily = (statistics?.water.daily ?? 0).toFixed(1);
	const waterWeekly = (statistics?.water.weekly ?? 0).toFixed(1);
	const waterMonthly = (statistics?.water.monthly ?? 0).toFixed(1);
	const waterTargets = getTarget(EXERCISE_TYPE_ENUM.WATER_INTAKE);

	const stepsDaily = statistics?.steps.daily ?? 0;
	const stepsWeekly = statistics?.steps.weekly ?? 0;
	const stepsMonthly = statistics?.steps.monthly ?? 0;
	const stepsTargets = getTarget(EXERCISE_TYPE_ENUM.STEPS);

	const heartRateDaily = statistics?.heartRate.daily ?? 0;
	const heartRateWeekly = statistics?.heartRate.weekly ?? 0;
	const heartRateMonthly = statistics?.heartRate.monthly ?? 0;
	const heartRateTargets = getTarget(EXERCISE_TYPE_ENUM.HEART_RATE);

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 133, 111, 0.05);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0, 133, 111, 0.3);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 133, 111, 0.5);
        }
      `}</style>
			<Sidebar />

			<main className="flex-1 flex justify-center items-start pt-6 pb-8">
				<div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="mb-8">
						<h1
							className="mb-2"
							style={{
								fontSize: "36px",
								fontWeight: 700,
								color: "#00453A",
								lineHeight: "44px",
								letterSpacing: "-0.02em",
							}}
							data-testid="title-health-assessment"
						>
							Health Assessment
						</h1>
						<p
							style={{
								fontSize: "16px",
								color: "#546E7A",
								lineHeight: "24px",
							}}
						>
							Comprehensive analysis of your health metrics and progress
						</p>
					</div>

					{/* Glucose Analysis Section */}
					<Card
						className="mb-8 p-6 lg:p-8 transition-all duration-300 hover:shadow-xl"
						style={{
							background: "#FFFFFF",
							border: "1px solid rgba(0, 133, 111, 0.12)",
							borderRadius: "16px",
							boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
						}}
						data-testid="section-glucose-analysis"
					>
						<div
							className="flex items-center gap-3 mb-6 pb-4 border-b"
							style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
						>
							<div
								style={{
									background:
										"linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
									borderRadius: "12px",
									padding: "12px",
								}}
							>
								<Activity size={24} style={{ color: "#4CAF50" }} />
							</div>
							<h2
								style={{
									fontSize: "24px",
									fontWeight: 700,
									color: "#00453A",
									margin: 0,
								}}
							>
								Glucose Analysis
							</h2>
						</div>
						<div className="flex flex-col sm:flex-row gap-8 items-center">
							<div className="w-full flex justify-center">
								<CircularGauge
									value={glucoseDaily}
									label="Daily Average"
									unit="mg/dL"
									metricType={EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE}
									size={200}
									recommendedTarget={glucoseTargets.recommended}
									userTarget={glucoseTargets.user}
								/>
							</div>
							<div className="w-full flex justify-center">
								<CircularGauge
									value={glucoseWeekly}
									label="Weekly Average"
									unit="mg/dL"
									metricType={EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE}
									size={200}
									recommendedTarget={glucoseTargets.recommended}
									userTarget={glucoseTargets.user}
								/>
							</div>
							<div className="w-full flex justify-center">
								<CircularGauge
									value={glucoseMonthly}
									label="Monthly Average"
									unit="mg/dL"
									metricType={EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE}
									size={200}
									recommendedTarget={glucoseTargets.recommended}
									userTarget={glucoseTargets.user}
								/>
							</div>
						</div>
					</Card>

					{/* Hydration and Activity Analysis - Stacked Vertically */}
					<div className="flex flex-col gap-6 mb-8">
						{/* Hydration Analysis */}
						<Card
							className="p-6 transition-all duration-300 hover:shadow-xl"
							style={{
								background: "#FFFFFF",
								border: "1px solid rgba(0, 133, 111, 0.12)",
								borderRadius: "16px",
								boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
							}}
							data-testid="section-hydration-analysis"
						>
							<div
								className="flex items-center gap-3 mb-6 pb-4 border-b"
								style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
							>
								<div
									style={{
										background:
											"linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
										borderRadius: "12px",
										padding: "10px",
									}}
								>
									<Droplet size={20} style={{ color: "#00856F" }} />
								</div>
								<h2
									style={{
										fontSize: "20px",
										fontWeight: 700,
										color: "#00453A",
										margin: 0,
									}}
								>
									Hydration Analysis
								</h2>
							</div>
							<div className="flex flex-col sm:flex-row gap-8 items-center">
								<div className="w-full flex justify-center">
									<CircularGauge
										value={parseFloat(waterDaily)}
										label="Daily"
										unit="L"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.WATER_INTAKE}
										recommendedTarget={waterTargets.recommended}
										userTarget={waterTargets.user}
									/>
								</div>
								<div className="w-full flex justify-center">
									<CircularGauge
										value={parseFloat(waterWeekly)}
										label="Weekly"
										unit="L"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.WATER_INTAKE}
										recommendedTarget={waterTargets.recommended}
										userTarget={waterTargets.user}
									/>
								</div>
								<div className="w-full flex justify-center">
									<CircularGauge
										value={parseFloat(waterMonthly)}
										label="Monthly"
										unit="L"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.WATER_INTAKE}
										recommendedTarget={waterTargets.recommended}
										userTarget={waterTargets.user}
									/>
								</div>
							</div>
						</Card>

						{/* Activity Analysis */}
						<Card
							className="p-6 transition-all duration-300 hover:shadow-xl"
							style={{
								background: "#FFFFFF",
								border: "1px solid rgba(0, 133, 111, 0.12)",
								borderRadius: "16px",
								boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
							}}
							data-testid="section-activity-analysis"
						>
							<div
								className="flex items-center gap-3 mb-6 pb-4 border-b"
								style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
							>
								<div
									style={{
										background:
											"linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
										borderRadius: "12px",
										padding: "10px",
									}}
								>
									<Activity size={20} style={{ color: "#2196F3" }} />
								</div>
								<h2
									style={{
										fontSize: "20px",
										fontWeight: 700,
										color: "#00453A",
										margin: 0,
									}}
								>
									Activity Analysis
								</h2>
							</div>
							<div className="flex flex-col sm:flex-row gap-8 items-center">
								<div className="w-full flex justify-center">
									<CircularGauge
										value={stepsDaily}
										label="Daily"
										unit="steps"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.STEPS}
										recommendedTarget={stepsTargets.recommended}
										userTarget={stepsTargets.user}
									/>
								</div>
								<div className="w-full flex justify-center">
									<CircularGauge
										value={stepsWeekly}
										label="Weekly"
										unit=" steps"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.STEPS}
										recommendedTarget={stepsTargets.recommended}
										userTarget={stepsTargets.user}
									/>
								</div>
								<div className="w-full flex justify-center">
									<CircularGauge
										value={stepsMonthly}
										label="Monthly"
										unit="steps"
										size={180}
										metricType={EXERCISE_TYPE_ENUM.STEPS}
										recommendedTarget={stepsTargets.recommended}
										userTarget={stepsTargets.user}
									/>
								</div>
							</div>
						</Card>

						{/* Heart Rate Analysis - Only for paid users */}
						{isPaidUser && (
							<Card
								className="p-6 transition-all duration-300 hover:shadow-xl"
								style={{
									background: "#FFFFFF",
									border: "1px solid rgba(0, 133, 111, 0.12)",
									borderRadius: "16px",
									boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
								}}
								data-testid="section-heart-rate-analysis"
							>
								<div
									className="flex items-center gap-3 mb-6 pb-4 border-b"
									style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
								>
									<div
										style={{
											background:
												"linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)",
											borderRadius: "12px",
											padding: "10px",
										}}
									>
										<Heart size={20} style={{ color: "#E91E63" }} />
									</div>
									<h2
										style={{
											fontSize: "20px",
											fontWeight: 700,
											color: "#00453A",
											margin: 0,
										}}
									>
										Heart Rate Analysis
									</h2>
								</div>
								<div className="flex flex-col sm:flex-row gap-8 items-center">
									<div className="w-full flex justify-center">
										<CircularGauge
											value={heartRateDaily}
											label="Daily"
											unit=" BPM"
											size={180}
											metricType={EXERCISE_TYPE_ENUM.HEART_RATE}
											recommendedTarget={heartRateTargets.recommended}
											userTarget={heartRateTargets.user}
										/>
									</div>
									<div className="w-full flex justify-center">
										<CircularGauge
											value={heartRateWeekly}
											label="Weekly"
											unit=" BPM"
											size={180}
											metricType={EXERCISE_TYPE_ENUM.HEART_RATE}
											recommendedTarget={heartRateTargets.recommended}
											userTarget={heartRateTargets.user}
										/>
									</div>
									<div className="w-full flex justify-center">
										<CircularGauge
											value={heartRateMonthly}
											label="Monthly"
											unit=" BPM"
											size={180}
											metricType={EXERCISE_TYPE_ENUM.HEART_RATE}
											recommendedTarget={heartRateTargets.recommended}
											userTarget={heartRateTargets.user}
										/>
									</div>
								</div>
							</Card>
						)}
					</div>

					{/* Summary Cards */}
					<div
						className={`grid grid-cols-1 md:grid-cols-2 ${isPaidUser ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6 mb-8`}
					>
						<InsightSummaryCard
							title="Hydration Summary"
							icon={Droplet}
							iconColor="#00856F"
							gradientColors={{
								from: "#E0F2F1",
								to: "#B2DFDB",
							}}
							borderColor="rgba(0, 133, 111, 0.2)"
							shadowColor="rgba(0, 133, 111, 0.1)"
							iconBgColor="#00856F"
							isLoading={insightsLoading}
							insight={waterIntakeInsight}
							testId="card-hydration-summary"
						/>

						<InsightSummaryCard
							title="Glucose Summary"
							icon={Activity}
							iconColor="#4CAF50"
							gradientColors={{
								from: "#E8F5E9",
								to: "#C8E6C9",
							}}
							borderColor="rgba(76, 175, 80, 0.2)"
							shadowColor="rgba(76, 175, 80, 0.1)"
							iconBgColor="#4CAF50"
							isLoading={insightsLoading}
							insight={glucoseInsight}
							testId="card-glucose-summary"
						/>

						<InsightSummaryCard
							title="Activity Summary"
							icon={Activity}
							iconColor="#2196F3"
							gradientColors={{
								from: "#E3F2FD",
								to: "#BBDEFB",
							}}
							borderColor="rgba(33, 150, 243, 0.2)"
							shadowColor="rgba(33, 150, 243, 0.1)"
							iconBgColor="#2196F3"
							isLoading={insightsLoading}
							insight={stepsInsight}
							testId="card-activity-summary"
						/>

						{isPaidUser && (
							<InsightSummaryCard
								title="Heart Rate Summary"
								icon={Heart}
								iconColor="#E91E63"
								gradientColors={{
									from: "#FCE4EC",
									to: "#F8BBD0",
								}}
								borderColor="rgba(233, 30, 99, 0.2)"
								shadowColor="rgba(233, 30, 99, 0.1)"
								iconBgColor="#E91E63"
								isLoading={insightsLoading}
								insight={heartRateInsight}
								testId="card-heart-rate-summary"
							/>
						)}
					</div>

					{/* Overall Health Summary Section */}
					<OverallHealthSummary
						summary={overallHealthSummary}
						isLoading={insightsLoading}
					/>

					{/* What to Do Next Section */}
					<WhatToDoNext tips={whatToDoNext} isLoading={insightsLoading} />
				</div>
			</main>
		</div>
	);
}
