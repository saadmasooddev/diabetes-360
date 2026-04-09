import { useState, useRef, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
	useScanFood,
	useUserDailyData,
	useConsumedNutrients,
} from "@/hooks/mutations/useFoodScanner";
import { useFoodScanStatus } from "@/hooks/mutations/useSettings";
import { useAuthStore } from "@/stores/authStore";
import type { ScanResult } from "@/mocks/scanResults";
import { UploadArea } from "../../components/FoodScanner/UploadArea";
import { ScanningAnimation } from "../../components/FoodScanner/ScanningAnimation";
import { FoodOverview } from "../../components/FoodScanner/FoodOverview";
import { PersonalizedInsight } from "../../components/FoodScanner/PersonalizedInsight";
import { BreakdownSection } from "../../components/FoodScanner/BreakdownSection";
import { NutritionalHighlight } from "../../components/FoodScanner/NutritionalHighlight";
import { LogMealPrompt } from "../../components/FoodScanner/LogMealPrompt";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	HealthTrendChart,
	IntervalType,
	formatTimeLabel,
	getDateRange,
	getFilteredMetricsQueryKeys,
} from "../../components/HealthTrendChart";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { DateManager, formatDate } from "@/lib/utils";
import type { LoggedMealRow } from "@/services/foodScannerService";
import { METRIC_TYPE_ENUM } from "@shared/schema";
import {
	useFilteredMetrics,
	useFilteredMetricsPaginated,
} from "@/hooks/mutations/useHealth";

type ScanStep = "upload" | "scanning" | "results";

const PAGE_SIZE = 10;

export function FoodScanner() {
	const [currentStep, setCurrentStep] = useState<ScanStep>("upload");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [scanLinePosition, setScanLinePosition] = useState(0);
	const [scanResult, setScanResult] = useState<ScanResult | null>(null);
	const [hasLoggedMeal, setHasLoggedMeal] = useState(false);
	const [dateRangeTab, setDateRangeTab] = useState<IntervalType>("weekly");
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");
	const [mealsPage, setMealsPage] = useState(1);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const scanFoodMutation = useScanFood();
	const user = useAuthStore((state) => state.user);
	const isPremium = user?.paymentType !== "free";
	const { data: scanStatus, refetch: refetchScanStatus } = useFoodScanStatus();
	const {
		data: nutritionRequirements,
		isLoading: isLoadingRequirements,
		isError: isErrorRequirements,
	} = useUserDailyData();
	const { data: consumedNutrients, refetch: refetchConsumedNutrients } =
		useConsumedNutrients();

	const dateRange = getDateRange(dateRangeTab, customStartDate, customEndDate);

	const {
		data: calorieIntakeMetrics,
		isError: isErrorCalorieProfile,
		isLoading: isLoadingCalorieProfile,
	} = useFilteredMetricsPaginated(
		dateRange.startDate,
		dateRange.endDate,
		[METRIC_TYPE_ENUM.CALORIE_INTAKE],
		PAGE_SIZE,
		(mealsPage - 1) * PAGE_SIZE,
	);

	useEffect(() => {
		if (isErrorRequirements) {
			toast({
				title: "Failed to Load Nutrition Requirements",
				description: "Failed to load nutrition requirements. Please try again.",
				variant: "destructive",
			});
		}
	}, [isErrorRequirements]);

	useEffect(() => {
		if (isErrorCalorieProfile) {
			toast({
				title: "Failed to Load Calorie Profile",
				description: "Failed to load your meals. Please try again.",
				variant: "destructive",
			});
		}
	}, [isErrorCalorieProfile]);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleUploadClick = () => fileInputRef.current?.click();

	const handleScanClick = async () => {
		if (!selectedFile) return;
		if (scanStatus && !scanStatus.canScan) return;
		setCurrentStep("scanning");
		try {
			const result = await scanFoodMutation.mutateAsync(selectedFile);
			setScanResult(result);
			refetchScanStatus();
			setTimeout(() => setCurrentStep("results"), 3000);
		} catch {
			setCurrentStep("upload");
		}
	};

	const handleBackClick = () => {
		setCurrentStep("upload");
		setSelectedFile(null);
		setPreviewUrl(null);
		setScanLinePosition(0);
		setScanResult(null);
		setHasLoggedMeal(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	useEffect(() => {
		if (currentStep !== "scanning") return;
		let position = 0;
		let direction = 1;
		const interval = setInterval(() => {
			position += direction * 0.8;
			if (position >= 100) {
				direction = -1;
				position = 100;
			} else if (position <= 0) {
				direction = 1;
				position = 0;
			}
			setScanLinePosition(position);
		}, 10);
		return () => clearInterval(interval);
	}, [currentStep]);

	const meals = calorieIntakeMetrics?.meals ?? [];
	const total = calorieIntakeMetrics?.pagination?.calorieIntake.total ?? 0;
	const calorieIntake = calorieIntakeMetrics?.calorieIntakeRecords ?? [];
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	const chartData = useMemo(
		() =>
			calorieIntake.map((d) => ({
				time: formatTimeLabel(new Date(d.recordedAt), "custom"),
				value: d.value || 0,
			})),
		[calorieIntake],
	);

	const showHeader = currentStep !== "upload" || previewUrl;
	const getHeaderTitle = () => {
		if (currentStep === "upload" && previewUrl) return "Upload Complete";
		if (currentStep === "scanning") return "Scanning";
		if (currentStep === "results") return "Results";
		return "";
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 p-4 lg:p-8 overflow-auto w-full">
				<div className="w-full max-w-5xl mx-auto space-y-6">
					{showHeader && (
						<div className="flex items-center gap-4 mb-6">
							<button
								onClick={handleBackClick}
								className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
								data-testid="button-back"
							>
								<ArrowLeft size={24} color="#00856F" />
							</button>
							<h1
								style={{
									fontSize: "24px",
									fontWeight: 600,
									color: "#00856F",
								}}
								data-testid="text-header-title"
							>
								{getHeaderTitle()}
							</h1>
						</div>
					)}

					{currentStep === "results" ? (
						<div className="space-y-6" data-testid="container-results">
							{!hasLoggedMeal && (
								<LogMealPrompt
									scanResult={scanResult}
									onLogged={() => {
										setHasLoggedMeal(true);
										refetchConsumedNutrients();
									}}
									onDismiss={() => {}}
								/>
							)}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<FoodOverview scanResult={scanResult} previewUrl={previewUrl} />
								<PersonalizedInsight
									scanResult={scanResult}
									isPremium={isPremium}
								/>
							</div>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<BreakdownSection
									scanResult={scanResult}
									nutritionRequirements={nutritionRequirements}
									consumedNutrients={consumedNutrients}
								/>
								<NutritionalHighlight
									scanResult={scanResult}
									previewUrl={previewUrl}
									isPremium={isPremium}
								/>
							</div>
						</div>
					) : currentStep === "scanning" ? (
						<div
							className="flex flex-col items-center max-w-[800px] mx-auto"
							style={{ marginTop: showHeader ? 0 : 120 }}
							data-testid="container-scanning"
						>
							<ScanningAnimation
								previewUrl={previewUrl}
								scanLinePosition={scanLinePosition}
							/>
						</div>
					) : (
						<>
							{/* Scan section at top */}
							<div
								className="flex flex-col items-center max-w-[800px] mx-auto"
								data-testid="container-upload"
							>
								<UploadArea
									previewUrl={previewUrl}
									onFileSelect={handleFileSelect}
									onUploadClick={handleUploadClick}
									onScanClick={handleScanClick}
									isScanning={false}
									isPending={scanFoodMutation.isPending}
									canScan={scanStatus?.canScan ?? true}
									limitMessage={
										scanStatus && !scanStatus.canScan
											? `Daily limit reached. You have used ${scanStatus.currentCount} out of ${scanStatus.limit} scans today.`
											: undefined
									}
								/>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileSelect}
									className="hidden"
									data-testid="input-file"
								/>
							</div>

							{/* Date range tabs + Calorie profile */}
							<Tabs
								value={dateRangeTab}
								onValueChange={(v) => {
									setDateRangeTab(v as IntervalType);
									setMealsPage(1);
								}}
							>
								<TabsList
									className="w-full justify-start flex-wrap h-auto gap-1 p-1"
									style={{
										background: "#FFFFFF",
										border: "1px solid rgba(0, 133, 111, 0.2)",
										borderRadius: "12px",
									}}
								>
									<TabsTrigger
										value="daily"
										className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00453A]"
									>
										Day
									</TabsTrigger>
									<TabsTrigger
										value="weekly"
										className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00453A]"
									>
										Week
									</TabsTrigger>
									<TabsTrigger
										value="monthly"
										className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00453A]"
									>
										Month
									</TabsTrigger>
									<TabsTrigger
										value="custom"
										className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00453A]"
										onClick={() => {
											if (!customStartDate || !customEndDate) {
												const end = new Date();
												const start = new Date();
												start.setDate(end.getDate() - 6);
												setCustomStartDate(formatDate(start, "yyyy-MM-dd"));
												setCustomEndDate(formatDate(end, "yyyy-MM-dd"));
											}
										}}
									>
										Custom
									</TabsTrigger>
								</TabsList>

								{dateRangeTab === "custom" && (
									<div className="flex flex-wrap items-center gap-3 mt-3">
										<label className="flex items-center gap-2 text-sm font-medium text-[#546E7A]">
											From
											<input
												type="date"
												value={customStartDate}
												onChange={(e) => {
													setCustomStartDate(e.target.value);
													setMealsPage(1);
												}}
												className="border rounded-lg px-3 py-2 text-sm border-[rgba(0,133,111,0.2)]"
											/>
										</label>
										<label className="flex items-center gap-2 text-sm font-medium text-[#546E7A]">
											To
											<input
												type="date"
												value={customEndDate}
												onChange={(e) => {
													setCustomEndDate(e.target.value);
													setMealsPage(1);
												}}
												className="border rounded-lg px-3 py-2 text-sm border-[rgba(0,133,111,0.2)]"
											/>
										</label>
									</div>
								)}
							</Tabs>

							{/* Calorie chart + table (always shown, driven by tab date range) */}
							<div className="mt-6 space-y-6">
								<HealthTrendChart
									title="Calories Chart"
									data={chartData}
									gradientId="calorieGradient"
									testId="calorie-trend-chart"
									height={260}
									yAxisConfig={{
										domain: [0, 4000],
										ticks: [0, 500, 1000, 1500, 2000, 2500, 3000],
										label: "kcal",
									}}
									interval="weekly"
								/>

								{/* Meals table */}
								<Card
									className="p-6"
									style={{
										background: "#FFFFFF",
										borderRadius: "16px",
										border: "1px solid rgba(0, 133, 111, 0.12)",
										boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
									}}
								>
									<h3
										style={{
											fontSize: "18px",
											fontWeight: 700,
											color: "#00453A",
											marginBottom: "16px",
										}}
									>
										Logged meals
									</h3>
									{isLoadingCalorieProfile ? (
										<div className="flex items-center justify-center py-12">
											<Loader2
												className="w-8 h-8 animate-spin"
												style={{ color: "#00856F" }}
											/>
										</div>
									) : meals.length === 0 ? (
										<div
											className="py-12 text-center text-[#78909C] rounded-lg border border-dashed"
											style={{ borderColor: "rgba(0, 133, 111, 0.2)" }}
										>
											No meals logged in this period
										</div>
									) : (
										<>
											<div className="overflow-x-auto">
												<table className="w-full text-sm">
													<thead>
														<tr
															style={{
																borderBottom:
																	"1px solid rgba(0, 133, 111, 0.15)",
															}}
														>
															<Th>Date</Th>
															<Th>Food</Th>
															<Th>Calories</Th>
															<Th>Carbs</Th>
															<Th>Protein</Th>
															<Th>Fat</Th>
														</tr>
													</thead>
													<tbody>
														{meals.map((row) => (
															<MealRow key={row.id} row={row} />
														))}
													</tbody>
												</table>
											</div>
											<ReusablePagination
												currentPage={mealsPage}
												totalPages={totalPages}
												onPageChange={setMealsPage}
											/>
										</>
									)}
								</Card>
							</div>
						</>
					)}
				</div>
			</main>
		</div>
	);
}

function Th({ children }: { children: React.ReactNode }) {
	return (
		<th
			className="text-left py-3 px-2 font-semibold"
			style={{ color: "#00453A" }}
		>
			{children}
		</th>
	);
}

function MealRow({ row }: { row: LoggedMealRow }) {
	return (
		<tr
			style={{
				borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
			}}
		>
			<td className="py-3 px-2" style={{ color: "#546E7A" }}>
				{DateManager.formatDisplayDate(row.mealDate)}
			</td>
			<td className="py-3 px-2 font-medium" style={{ color: "#263238" }}>
				{row.foodName}
			</td>
			<td className="py-3 px-2" style={{ color: "#00856F", fontWeight: 600 }}>
				{row.calories}
			</td>
			<td className="py-3 px-2" style={{ color: "#546E7A" }}>
				{row.carbs}g
			</td>
			<td className="py-3 px-2" style={{ color: "#546E7A" }}>
				{row.proteins}g
			</td>
			<td className="py-3 px-2" style={{ color: "#546E7A" }}>
				{row.fats}g
			</td>
		</tr>
	);
}
