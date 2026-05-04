import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import { ROUTES } from "@/config/routes";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import healthyFoodImg from "@assets/55ff7c0e103d474de22c65ec97f5ff150c7ef2af_1761129643122.jpg";
import { useUserDailyData } from "@/hooks/mutations/useFoodScanner";
import { useAppStore } from "@/stores/appStore";
import type { FoodSuggestion, MealDetails } from "@/services/foodScannerService";
import { HealthMetricCard } from "../../components/HealthMetricCard";
import {
	HealthTrendChart,
	type IntervalType,
	formatTimeLabel,
	getDateRange,
	getFilteredMetricsQueryKeys,
} from "../../components/HealthTrendChart";
import { AddMetricDialog } from "../../components/AddMetricDialog";
import { GlucoseImageVerificationDialog } from "../../components/GlucoseImageVerificationDialog";
import { DailyQuickLogsModal } from "../../components/DailyQuickLogsModal";
import { UploadMedicalReportsModal } from "../../components/UploadMedicalReportsModal";
import {
	type FilteredMetricsKey,
	useAddActivityLogsBatch,
	useCreateDailyQuickLog,
	useFilteredMetrics,
	useLatestHealthMetric,
	useTargetsForUser,
	useUploadGlucoseMeterImage,
} from "@/hooks/mutations/useHealth";
import { calorieUtils, utils } from "@/lib/utils";
import {
	ACTIVITY_TYPE_ENUM,
	METRIC_TYPE_ENUM,
	MEAL_TYPE_ENUM,
	BLOOD_SUGAR_READING_TYPES_ENUM,
	PAYMENT_TYPE,
	type InsertHealthMetric,
	type MetricType,
	BloodSugarReadingTypeEnumValues,
	type QuickLogExerciseTypeEnumValues,
	type QuickLogDietTypeEnumValues,
	type QuickLogSleepDurationTypeEnumValues,
	type QuickLogMedicinesTypeEnumValues,
	type QuickLogStressLevelTypeEnumValues,
	HealthMetricData,
	HEALTH_METRIC_SOURCE_ENUM,
	metricTypeEnum,
} from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import type { ModifiedInsertExerciseLogs } from "@/services/healthService";

export function Dashboard() {
	const user = useAuthStore((state) => state.user);
	const isFreeUser = user?.paymentType === PAYMENT_TYPE.FREE;
	const isPaidUser =
		!!user?.paymentType && user.paymentType !== PAYMENT_TYPE.FREE;
	const setMeal = useAppStore((state) => state.setMeal);

	const { data: userDailyData, isLoading: isLoadingUserDailyData } =
		useUserDailyData();
	const foodSuggestions = userDailyData?.foodSuggestions ?? [];
	const personalInsights = userDailyData?.foodInsights ?? [];

	type MealTypeValue = (typeof MEAL_TYPE_ENUM)[keyof typeof MEAL_TYPE_ENUM];

	function getMealsForCurrentTimeOfDay(
		fs: FoodSuggestion[],
	): { meals: MealDetails[]; mealType: MealTypeValue } | undefined {
		const currentTime = new Date().getHours();
		let meals: MealDetails[] | undefined;
		let mealType: MealTypeValue | undefined;
		if (currentTime >= 6 && currentTime < 11) {
			mealType = MEAL_TYPE_ENUM.Breakfast;
			meals = fs.find(
				(meal) => meal.mealType === MEAL_TYPE_ENUM.Breakfast,
			)?.meals;
		} else if (currentTime >= 11 && currentTime < 17) {
			mealType = MEAL_TYPE_ENUM.Lunch;
			meals = fs.find((meal) => meal.mealType === MEAL_TYPE_ENUM.Lunch)?.meals;
		} else {
			mealType = MEAL_TYPE_ENUM.Dinner;
			meals = fs.find((meal) => meal.mealType === MEAL_TYPE_ENUM.Dinner)?.meals;
		}

		if (!meals?.length || !mealType) return undefined;
		return { meals, mealType: mealType as MealTypeValue };
	}

	const mealsForTimeOfDay = getMealsForCurrentTimeOfDay(foodSuggestions);
	const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (!carouselApi) return;
		setSelectedIndex(carouselApi.selectedScrollSnap());
		const onSelect = () => setSelectedIndex(carouselApi.selectedScrollSnap());
		carouselApi.on("select", onSelect);
		return () => {
			carouselApi.off("select", onSelect);
		};
	}, [carouselApi]);
	const { toast } = useToast();
	const [, setLocation] = useLocation();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [limitDialogOpen, setLimitDialogOpen] = useState(false);
	const [selectedMetricType, setSelectedMetricType] = useState<MetricType>(
		METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
	);
	const [bloodSugarReadingType, setBloodSugarReadingType] =
		useState<BloodSugarReadingTypeEnumValues>("normal");
	const [metricValue, setMetricValue] = useState("");
	const [glucoseInterval, setGlucoseInterval] = useState<IntervalType>("daily");
	const [stepsInterval, setStepsInterval] = useState<IntervalType>("daily");
	const [waterInterval, setWaterInterval] = useState<IntervalType>("daily");
	const [heartbeatInterval, setHeartbeatInterval] =
		useState<IntervalType>("daily");

	const { data: targets } = useTargetsForUser();
	const addActivityLogsBatch = useAddActivityLogsBatch();
	const createDailyQuickLog = useCreateDailyQuickLog();
	const uploadGlucoseImage = useUploadGlucoseMeterImage();
	const isUploadingGlucoseImage = uploadGlucoseImage.isPending;

	const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
	const [extractedReading, setExtractedReading] = useState<string>("");
	const [uploadedImagePreview, setUploadedImagePreview] = useState<string>("");
	const [dailyQuickLogsOpen, setDailyQuickLogsOpen] = useState(false);
	const [medicalReportsModalOpen, setMedicalReportsModalOpen] = useState(false);
	const [medicalReportsInitialStep, setMedicalReportsInitialStep] = useState<
		1 | 2
	>(1);

	// Helper function to calculate date range based on interval

	const { data: latestMetric } = useLatestHealthMetric();
	const freeTierLimits = latestMetric?.remainingLimits;
	const latestBloodSugar = parseFloat(
		latestMetric?.current?.bloodSugar?.toString() ?? "0",
	);
	const latestFastingSugar = parseFloat(
		latestMetric?.current?.fastingSugar ?? "0",
	);
	const latestRandomSugar = parseFloat(
		latestMetric?.current?.randomSugar ?? "0",
	);
	// Steps and water are now totals for today, not latest values
	const latestStepsValue = latestMetric?.current?.steps;
	const latestSteps =
		typeof latestStepsValue === "number"
			? latestStepsValue
			: latestStepsValue
				? parseInt(String(latestStepsValue))
				: 0;
	const latestHeartRate = latestMetric?.current?.heartRate ?? 0;
	const latestHba1c = latestMetric?.current?.hba1c ?? "-";
	const exerciseSetsToday =
		(typeof latestMetric?.current?.exerciseSets === "number"
			? latestMetric.current.exerciseSets
			: 0) ?? 0;

	const previousBloodSugar = parseFloat(
		latestMetric?.previous?.bloodSugar?.toString() ?? "0",
	);
	// Previous day totals for comparison
	const previousStepsValue = latestMetric?.previous?.steps;
	const previousSteps =
		typeof previousStepsValue === "number"
			? previousStepsValue
			: previousStepsValue
				? parseInt(String(previousStepsValue))
				: 0;
	const previousHeartRate = latestMetric?.previous?.heartRate ?? 0;

	const glucoseDateRange = getDateRange(glucoseInterval);
	const stepsDateRange = getDateRange(stepsInterval);
	const waterDateRange = getDateRange(waterInterval);
	const heartbeatDateRange = getDateRange(heartbeatInterval);

	const bloodGlucoseQueryKey = getFilteredMetricsQueryKeys(
		METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
		glucoseDateRange,
	);
	const stepsQueryKey = getFilteredMetricsQueryKeys(
		METRIC_TYPE_ENUM.STEPS,
		stepsDateRange,
	);
	const heartBeatQueryKey = getFilteredMetricsQueryKeys(
		METRIC_TYPE_ENUM.HEART_RATE,
		heartbeatDateRange,
	);

	const { data: glucoseMetrics } = useFilteredMetrics(bloodGlucoseQueryKey);

	const { data: stepsMetrics } = useFilteredMetrics(stepsQueryKey);

	const { data: heartbeatMetrics } = useFilteredMetrics(heartBeatQueryKey);

	const getHasReachedLimit = (metricType: MetricType): boolean => {
		if (!freeTierLimits) return false;

		const metricsRemainingLimitsMap: Record<MetricType, number> = {
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: freeTierLimits.glucoseLimit,
			[METRIC_TYPE_ENUM.STEPS]: freeTierLimits.stepsLimit,
			[METRIC_TYPE_ENUM.HEART_RATE]: Infinity,
			[METRIC_TYPE_ENUM.CALORIE_INTAKE]: Infinity,
		};

		return metricsRemainingLimitsMap[metricType] <= 0;
	};

	const handleAddLog = (
		metricType: MetricType,
		readingType: BloodSugarReadingTypeEnumValues = BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
	) => {
		if (getHasReachedLimit(metricType)) {
			setLimitDialogOpen(true);
			return;
		}
		setSelectedMetricType(metricType);
		setBloodSugarReadingType(readingType);
		setDialogOpen(true);
	};

	const handleSubmitLog = () => {
		if (!metricValue || !user?.id) return;

		const numericValue = parseFloat(metricValue);
		if (isNaN(numericValue)) {
			toast({
				title: "Invalid Value",
				description: "Please enter a valid number",
				variant: "destructive",
			});
			return;
		}

		// Validate negative values
		if (numericValue <= 0) {
			toast({
				title: "Invalid Value",
				description: "Value cannot be zero or negative",
				variant: "destructive",
			});
			return;
		}

		if (
			selectedMetricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE &&
			bloodSugarReadingType === BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C &&
			(numericValue < 0 || numericValue > 100)
		) {
			toast({
				title: "Invalid Value",
				description: "HbA1c value must be between 0 and 100",
				variant: "destructive",
			});
			return;
		}

		// Validate maximum limits for steps and water
		if (selectedMetricType === METRIC_TYPE_ENUM.STEPS) {
			const newTotal = latestSteps + numericValue;
			if (newTotal > 20000) {
				toast({
					title: "Daily Limit Exceeded",
					description: `Adding ${numericValue} steps would exceed the daily limit of 20,000 steps. Current total: ${Math.round(newTotal)} steps.`,
					variant: "destructive",
				});
				return;
			}
		}

		const metricData: HealthMetricData = {
			userId: user.id,
			bloodSugar: [],
			bloodSugarReadingType: bloodSugarReadingType,
			heartRate: [],
			waterIntake: [],
		};
		const exercises: ModifiedInsertExerciseLogs[] = [];
		const queriesToInvalidate: FilteredMetricsKey[] = [];

		const floadMetricValue = parseFloat(numericValue.toFixed(1));
		const roundedMetricValue = Math.round(numericValue);

		const metircTypeReadingMap: Record<MetricType, () => void> = {
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE]: () => {
				utils.addToHealthMetricReading(metricData.bloodSugar, floadMetricValue);
				metricData.bloodSugarReadingType = bloodSugarReadingType;
				queriesToInvalidate.push(bloodGlucoseQueryKey);
			},
			[METRIC_TYPE_ENUM.STEPS]: () => {
				const calories =
					calorieUtils.getEstimatedCaloriesBurnedForSteps(numericValue);
				const duration =
					calorieUtils.getEstimatedDurationForSteps(numericValue);
				exercises.push({
					exerciseName: "Walk",
					calories,
					activityType: ACTIVITY_TYPE_ENUM.CARDIO,
					duration,
					steps: roundedMetricValue,
					recordedAt: new Date().toISOString(),
					source: HEALTH_METRIC_SOURCE_ENUM.CUSTOM,
				});
				queriesToInvalidate.push(stepsQueryKey);
			},
			[METRIC_TYPE_ENUM.HEART_RATE]: () => {
				utils.addToHealthMetricReading(
					metricData.heartRate,
					roundedMetricValue,
				);
				queriesToInvalidate.push(heartBeatQueryKey);
			},
			[METRIC_TYPE_ENUM.CALORIE_INTAKE]: () => {},
		};

		const f = metircTypeReadingMap[selectedMetricType];
		if (!f) {
			toast({
				title: "Invalid reading type",
				description: "Please select a valid readingtype",
				variant: "destructive",
			});
			return;
		}

		f();

		addActivityLogsBatch.mutate(
			{ exercises, healthMetrics: metricData },
			{
				onSuccess: () => {
					setDialogOpen(false);
					setMetricValue("");
					setBloodSugarReadingType(BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL);
					setSelectedMetricType(METRIC_TYPE_ENUM.BLOOD_GLUCOSE); // Reset to default
					queriesToInvalidate.forEach((q) => {
						queryClient.invalidateQueries({ queryKey: [q] });
					});
				},
			},
		);
	};

	const handleUploadPicture = (file: File) => {
		setSelectedMetricType(METRIC_TYPE_ENUM.BLOOD_GLUCOSE);
		if (!file.type.startsWith("image/")) {
			toast({
				title: "Invalid File",
				description: "Please upload an image file",
				variant: "destructive",
			});
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 3.5 * 1024 * 1024) {
			toast({
				title: "File Too Large",
				description: "Please upload an image smaller than 5MB",
				variant: "destructive",
			});
			return;
		}
		setUploadedImagePreview(URL.createObjectURL(file));
		uploadGlucoseImage.mutate(file, {
			onSuccess: (data) => {
				setExtractedReading(data.blood_sugar_reading);
				setVerificationDialogOpen(true);
			},
		});
	};

	const handleConfirmReading = () => {
		if (!extractedReading || !user?.id) return;

		const numericValue = parseFloat(extractedReading);
		if (isNaN(numericValue)) {
			toast({
				title: "Invalid Reading",
				description: "Please verify the extracted reading",
				variant: "destructive",
			});
			return;
		}

		if (numericValue < 0) {
			toast({
				title: "Invalid Reading",
				description: "Blood sugar reading cannot be negative",
				variant: "destructive",
			});
			return;
		}

		const metricData: HealthMetricData = {
			userId: user.id,
			bloodSugar: [],
			bloodSugarReadingType: BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
			heartRate: [],
			waterIntake: [],
		};

		utils.addToHealthMetricReading(metricData.bloodSugar, numericValue);

		addActivityLogsBatch.mutate(
			{ exercises: [], healthMetrics: metricData },
			{
				onSuccess: () => {
					setVerificationDialogOpen(false);
					setExtractedReading("");
					setUploadedImagePreview("");
					queryClient.invalidateQueries({ queryKey: [bloodGlucoseQueryKey] });
					toast({
						title: "Success",
						description: "Glucose reading logged successfully",
					});
				},
			},
		);
	};

	const handleCancelVerification = () => {
		setVerificationDialogOpen(false);
		setExtractedReading("");
		setUploadedImagePreview("");
	};

	const handleHealthAssessment = () => {
		setLocation(ROUTES.HEALTH_ASSESSMENT);
	};

	const handleUpgrade = () => {
		setLocation(ROUTES.HEALTH_PLANS);
	};

	// Transform metrics data for charts
	const glucoseData = useMemo(() => {
		if (!glucoseMetrics?.bloodSugarRecords?.length) return [];

		// Reverse the array so oldest is on left, newest on right
		return [...glucoseMetrics.bloodSugarRecords].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, glucoseInterval),
				value: m.value || 0,
			};
		});
	}, [glucoseMetrics, glucoseInterval]);

	const stepsData = useMemo(() => {
		if (!stepsMetrics?.stepsRecords?.length) return [];

		// Reverse the array so oldest is on left, newest on right
		return [...stepsMetrics.stepsRecords].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, stepsInterval),
				value: (m.value as number) || 0,
			};
		});
	}, [stepsMetrics, stepsInterval]);

	const heartbeatData = useMemo(() => {
		if (!heartbeatMetrics?.heartBeatRecords?.length) return [];

		// Reverse the array so oldest is on left, newest on right
		return [...heartbeatMetrics.heartBeatRecords].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, heartbeatInterval),
				value: (m.value as number) || 0,
			};
		});
	}, [heartbeatMetrics, heartbeatInterval]);

	const getTrendArrow = (currentValue: number, previousValue: number) => {
		if (currentValue === 0 && previousValue === 0) return null;
		return currentValue > previousValue ? (
			<ArrowUp
				className="ml-2 inline-block"
				style={{ color: "#4CAF50", width: "24px", height: "24px" }}
			/>
		) : (
			<ArrowDown
				className="ml-2 inline-block"
				style={{ color: "#F44336", width: "24px", height: "24px" }}
			/>
		);
	};

	// Helper function to get target values for a metric type
	const getTargets = (metricType: MetricType) => {
		const recommended = targets?.recommended.find(
			(t) => t.metricType === metricType,
		);
		const user = targets?.user.find((t) => t.metricType === metricType);

		return {
			recommended: recommended
				? parseFloat(recommended.targetValue)
				: undefined,
			user: user ? parseFloat(user.targetValue) : undefined,
		};
	};

	return (
		<div className="flex min-h-screen " style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 p-4 lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6 ">
					{/* Welcome / greeting */}
					{isPaidUser && user && (
						<div className="mb-6">
							<h1
								className="text-2xl md:text-3xl font-bold"
								style={{ color: "#212529" }}
								data-testid="text-greeting"
							>
								Hello,{" "}
								<span style={{ color: "#00856F" }}>{user.firstName}</span>!
							</h1>
						</div>
					)}
					{!isPaidUser && (
						<div className="mb-8">
							<h1
								className="text-3xl font-bold mb-2"
								style={{ color: "#00453A" }}
							>
								Health Dashboard
							</h1>
							<p className="text-base" style={{ color: "#546E7A" }}>
								Track your health metrics and monitor your progress
							</p>
						</div>
					)}

					{/* Metric Cards Row */}
					<div className=" mb-8 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
						<HealthMetricCard
							type={METRIC_TYPE_ENUM.BLOOD_GLUCOSE}
							latestValue={latestBloodSugar.toString()}
							trendArrow={getTrendArrow(latestBloodSugar, previousBloodSugar)}
							onAddLog={() =>
								handleAddLog(
									METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
									BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL,
								)
							}
							onUploadPicture={handleUploadPicture}
							isUploading={isUploadingGlucoseImage}
							onUpgrade={handleUpgrade}
							disabled={getHasReachedLimit(METRIC_TYPE_ENUM.BLOOD_GLUCOSE)}
							dailyLimit={freeTierLimits?.glucoseLimit || 0}
							hideUpgradeCallToAction={!isFreeUser}
						/>

						<HealthMetricCard
							type={METRIC_TYPE_ENUM.BLOOD_GLUCOSE}
							latestValue={latestRandomSugar.toString()}
							trendArrow={null}
							title="Random Sugar"
							onAddLog={() =>
								handleAddLog(
									METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
									BLOOD_SUGAR_READING_TYPES_ENUM.RANDOM,
								)
							}
							onUpgrade={handleUpgrade}
							disabled={getHasReachedLimit(METRIC_TYPE_ENUM.BLOOD_GLUCOSE)}
							dailyLimit={freeTierLimits?.glucoseLimit || 0}
							hideUpgradeCallToAction={!isFreeUser}
							hideUploadButton
						/>

						<HealthMetricCard
							type={METRIC_TYPE_ENUM.BLOOD_GLUCOSE}
							latestValue={latestFastingSugar.toString()}
							trendArrow={null}
							title="Fasting Sugar"
							onAddLog={() =>
								handleAddLog(
									METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
									BLOOD_SUGAR_READING_TYPES_ENUM.FASTING,
								)
							}
							onUpgrade={handleUpgrade}
							disabled={getHasReachedLimit(METRIC_TYPE_ENUM.BLOOD_GLUCOSE)}
							dailyLimit={freeTierLimits?.glucoseLimit || 0}
							hideUpgradeCallToAction={!isFreeUser}
							hideUploadButton
						/>

						<HealthMetricCard
							type={METRIC_TYPE_ENUM.BLOOD_GLUCOSE}
							latestValue={latestHba1c.toString()}
							trendArrow={null}
							title="HbA1c"
							onAddLog={() =>
								handleAddLog(
									METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
									BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C,
								)
							}
							onUpgrade={handleUpgrade}
							disabled={getHasReachedLimit(METRIC_TYPE_ENUM.BLOOD_GLUCOSE)}
							dailyLimit={freeTierLimits?.glucoseLimit || 0}
							hideUpgradeCallToAction={!isFreeUser}
							hideUploadButton
						/>

						<HealthMetricCard
							type={METRIC_TYPE_ENUM.STEPS}
							latestValue={exerciseSetsToday.toString()}
							trendArrow={null}
							title="Exercise"
							unit="sets"
							onAddLog={() => setDailyQuickLogsOpen(true)}
							onUpgrade={handleUpgrade}
							disabled={false}
							dailyLimit={0}
							hideUpgradeCallToAction
							hideUploadButton
						/>

						<HealthMetricCard
							type={METRIC_TYPE_ENUM.STEPS}
							latestValue={latestSteps}
							trendArrow={getTrendArrow(latestSteps, previousSteps)}
							onAddLog={() => handleAddLog(METRIC_TYPE_ENUM.STEPS)}
							onUpgrade={handleUpgrade}
							disabled={getHasReachedLimit(METRIC_TYPE_ENUM.STEPS)}
							dailyLimit={freeTierLimits?.stepsLimit || 0}
							hideUpgradeCallToAction={!isFreeUser}
						/>

						{/* Heart Beat Card - Only for paid users */}
						{user?.paymentType !== "free" && user?.paymentType && (
							<HealthMetricCard
								type={METRIC_TYPE_ENUM.HEART_RATE}
								latestValue={latestHeartRate.toString()}
								trendArrow={getTrendArrow(latestHeartRate, previousHeartRate)}
								onAddLog={() => handleAddLog(METRIC_TYPE_ENUM.HEART_RATE)}
								onUpgrade={handleUpgrade}
								disabled={false}
								dailyLimit={0}
								hideUpgradeCallToAction={!isFreeUser}
							/>
						)}
					</div>

					{/* Daily Quick Logs and Upload Medical Reports */}
					<div className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div
							className="flex items-center justify-between p-4 rounded-xl border"
							style={{
								background: "#FFFFFF",
								borderColor: "rgba(0, 133, 111, 0.2)",
								boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
							}}
						>
							<span
								className="font-semibold"
								style={{ color: "#00453A", fontSize: "16px" }}
							>
								Daily Quick Logs
							</span>
							<Button
								onClick={() => setDailyQuickLogsOpen(true)}
								size="sm"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								Continue
							</Button>
						</div>
						<div
							className="flex items-center justify-between p-4 rounded-xl border"
							style={{
								background: "#FFFFFF",
								borderColor: "rgba(0, 133, 111, 0.2)",
								boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
							}}
						>
							<span
								className="font-semibold"
								style={{ color: "#00453A", fontSize: "16px" }}
							>
								Upload Medical Reports
							</span>
							<Button
								onClick={() => {
									setMedicalReportsInitialStep(2);
									setMedicalReportsModalOpen(true);
								}}
								size="sm"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								Upload
							</Button>
						</div>
					</div>

					{/* Paid users: meal suggestions, consultation, insights — merged from former Home */}
					{isPaidUser && (
						<>
							<div className="mb-8">
								<h2
									className="mb-4 text-xl font-bold md:text-2xl"
									style={{ color: "#00856F" }}
									data-testid="text-meal-plans-title"
								>
									Personalized Meal Plans for You
								</h2>

								{isLoadingUserDailyData ? (
									<Card
										className="p-4 md:p-6"
										style={{
											background: "#FFFFFF",
											border: "1px solid #EAEAEA",
											borderRadius: "10px",
										}}
									>
										<div className="flex flex-col md:flex-row gap-4">
											<Skeleton className="h-32 w-full md:w-48 rounded-lg" />
											<div className="flex-1 space-y-3">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-6 w-48" />
												<div className="flex gap-2">
													<Skeleton className="h-6 w-20" />
													<Skeleton className="h-6 w-20" />
													<Skeleton className="h-6 w-20" />
												</div>
											</div>
										</div>
									</Card>
								) : mealsForTimeOfDay ? (
									<div className="relative" data-testid="card-meal-plan">
										<Carousel
											setApi={setCarouselApi}
											opts={{
												align: "start",
												loop: true,
												dragFree: false,
											}}
											className="w-full"
										>
											<CarouselContent className="-ml-0">
												{mealsForTimeOfDay.meals.map((meal, index) => (
													<CarouselItem key={index} className="pl-0">
														<Card
															className="overflow-hidden"
															style={{
																background: "#FFFFFF",
																border: "1px solid #EAEAEA",
																borderRadius: "10px",
															}}
														>
															<div className="flex flex-col md:flex-row">
																<div className="relative h-48 md:h-auto md:w-48 flex-shrink-0">
																	<Image
																		src={healthyFoodImg}
																		alt={meal.name}
																		className="h-full w-full object-cover"
																	/>
																</div>
																<div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
																	<div>
																		<p
																			className="mb-2 text-sm"
																			style={{ color: "#546E7A" }}
																		>
																			{mealsForTimeOfDay.mealType}
																		</p>
																		<h3
																			className="mb-4 text-lg font-bold md:text-xl"
																			style={{ color: "#00856F" }}
																		>
																			{meal.name}
																		</h3>
																		<div className="flex flex-wrap gap-2 mb-4">
																			<span
																				className="px-3 py-1 rounded-md text-xs font-medium"
																				style={{
																					background: "#DCE9E2",
																					color: "#00856F",
																				}}
																			>
																				Carbs:{" "}
																				{parseFloat(
																					meal.nutrition_info.carbs.toString(),
																				).toFixed(0)}
																				g
																			</span>
																			<span
																				className="px-3 py-1 rounded-md text-xs font-medium"
																				style={{
																					background: "#DCE9E2",
																					color: "#00856F",
																				}}
																			>
																				Calories:{" "}
																				{parseFloat(
																					meal.nutrition_info.calories.toString(),
																				).toFixed(0)}
																			</span>
																			<span
																				className="px-3 py-1 rounded-md text-xs font-medium"
																				style={{
																					background: "#DCE9E2",
																					color: "#00856F",
																				}}
																			>
																				Proteins:{" "}
																				{parseFloat(
																					meal.nutrition_info.proteins.toString(),
																				).toFixed(0)}
																				g
																			</span>
																		</div>
																	</div>
																	<Button
																		className="w-full md:w-auto md:ml-auto"
																		style={{
																			background: "#00856F",
																			color: "#FFFFFF",
																			borderRadius: "5px",
																			padding: "8px 24px",
																			fontSize: "14px",
																			fontWeight: 600,
																		}}
																		onClick={() => {
																			setMeal({
																				meal,
																				mealType: mealsForTimeOfDay.mealType,
																			});
																			setLocation(ROUTES.RECIPE_DETAIL);
																		}}
																		data-testid="button-view-recipe"
																	>
																		View Recipe
																	</Button>
																</div>
															</div>
														</Card>
													</CarouselItem>
												))}
											</CarouselContent>
											{mealsForTimeOfDay.meals.length > 1 && (
												<>
													<Button
														variant="outline"
														size="icon"
														className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full border-[#EAEAEA] bg-white shadow-md hover:bg-[#F7F9F9] md:left-2"
														onClick={() => carouselApi?.scrollPrev()}
														disabled={
															selectedIndex === 0 &&
															!carouselApi?.canScrollPrev()
														}
													>
														<ChevronLeft className="h-5 w-5 text-[#00856F]" />
														<span className="sr-only">Previous meal</span>
													</Button>
													<Button
														variant="outline"
														size="icon"
														className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full border-[#EAEAEA] bg-white shadow-md hover:bg-[#F7F9F9] md:right-2"
														onClick={() => carouselApi?.scrollNext()}
														disabled={
															selectedIndex ===
																mealsForTimeOfDay.meals.length - 1 &&
															!carouselApi?.canScrollNext()
														}
													>
														<ChevronRight className="h-5 w-5 text-[#00856F]" />
														<span className="sr-only">Next meal</span>
													</Button>
													<div className="flex justify-center gap-1.5 mt-3">
														{mealsForTimeOfDay.meals.map((_, index) => (
															<button
																key={index}
																type="button"
																aria-label={`Go to meal ${index + 1}`}
																onClick={() => carouselApi?.scrollTo(index)}
																className={`h-2 rounded-full transition-all ${
																	index === selectedIndex
																		? "w-6 bg-[#00856F]"
																		: "w-2 bg-[#DCE9E2] hover:bg-[#00856F]/70"
																}`}
															/>
														))}
													</div>
												</>
											)}
										</Carousel>
									</div>
								) : null}
							</div>

							<Card
								className="mb-8 overflow-hidden cursor-pointer transition-all hover:shadow-lg"
								style={{
									background: "#00856F",
									borderRadius: "10px",
								}}
								onClick={() => setLocation(ROUTES.CONSULTATIONS)}
								data-testid="card-weekly-consultation"
							>
								<div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6">
									<h3 className="mb-3 sm:mb-0 text-lg md:text-xl font-semibold text-white">
										Weekly Half Hour Consultation
									</h3>
									<Button
										style={{
											background: "#FFFFFF",
											color: "#00856F",
											borderRadius: "5px",
											padding: "10px 24px",
											fontSize: "14px",
											fontWeight: 600,
											whiteSpace: "nowrap",
										}}
										onClick={(e) => {
											e.stopPropagation();
											setLocation(ROUTES.CONSULTATIONS);
										}}
										data-testid="button-book-consultation"
									>
										Book Now
									</Button>
								</div>
							</Card>

							<div className="mb-10">
								<h2
									className="mb-4 text-xl font-bold md:text-2xl"
									style={{ color: "#00856F" }}
									data-testid="text-insights-title"
								>
									Personal Insights for You
								</h2>

								{isLoadingUserDailyData ? (
									<div className="space-y-3">
										{[1, 2, 3].map((i) => (
											<Card
												key={i}
												className="p-4"
												style={{
													background: "#FFFFFF",
													border: "1px solid #EAEAEA",
													borderRadius: "10px",
												}}
											>
												<div className="flex items-start gap-3">
													<Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
													<Skeleton className="h-4 flex-1" />
												</div>
											</Card>
										))}
									</div>
								) : personalInsights && personalInsights.length > 0 ? (
									<div className="space-y-3">
										{personalInsights.map((insight) => (
											<Card
												key={insight.id}
												className="p-4"
												style={{
													background: "#FFFFFF",
													border: "1px solid #EAEAEA",
													borderRadius: "10px",
												}}
												data-testid={`card-insight-${insight.id}`}
											>
												<div className="flex items-start gap-3">
													<Heart
														className="h-5 w-5 flex-shrink-0 mt-0.5"
														style={{ color: "#DCE9E2" }}
														fill="#DCE9E2"
													/>
													<p
														className="text-sm md:text-base"
														style={{ color: "#212529" }}
													>
														{insight.insightText}
													</p>
												</div>
											</Card>
										))}
									</div>
								) : null}
							</div>
						</>
					)}

					{/* Health Assessment Button */}
					<div className="mb-6 flex justify-center">
						<Button
							onClick={handleHealthAssessment}
							className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
							style={{
								background: "linear-gradient(135deg, #00856F 0%, #006B5C 100%)",
								color: "#FFFFFF",
								borderRadius: "12px",
								fontSize: "16px",
								fontWeight: 600,
								padding: "16px 56px",
								border: "none",
								boxShadow: "0 4px 12px rgba(0, 133, 111, 0.3)",
							}}
							data-testid="button-health-assessment"
						>
							Health Assessment
						</Button>
					</div>

					{/* Charts Section */}
					<div className="space-y-6">
						<HealthTrendChart
							title="Glucose Trend"
							data={glucoseData}
							gradientId="glucoseGradient"
							testId="card-glucose-trend"
							height={250}
							yAxisConfig={{
								domain: [0, 120],
								ticks: [0, 70, 80, 90, 100],
							}}
							interval={glucoseInterval}
							onIntervalChange={setGlucoseInterval}
							recommendedTarget={
								getTargets(METRIC_TYPE_ENUM.BLOOD_GLUCOSE).recommended
							}
							userTarget={getTargets(METRIC_TYPE_ENUM.BLOOD_GLUCOSE).user}
						/>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<HealthTrendChart
								title="Steps Walked Trend"
								data={stepsData}
								gradientId="stepsGradient"
								testId="card-steps-trend"
								height={200}
								yAxisConfig={{
									domain: [0, 11000],
									ticks: [0, 3000, 6000, 9000, 11000],
								}}
								interval={stepsInterval}
								onIntervalChange={setStepsInterval}
								recommendedTarget={
									getTargets(METRIC_TYPE_ENUM.STEPS).recommended
								}
								userTarget={getTargets(METRIC_TYPE_ENUM.STEPS).user}
							/>
						</div>

						{/* Heart Beat Chart - Only for paid users */}
						{user?.paymentType !== "free" && user?.paymentType && (
							<HealthTrendChart
								title="Heart Rate Trend"
								data={heartbeatData}
								gradientId="heartbeatGradient"
								testId="card-heartbeat-trend"
								height={200}
								yAxisConfig={{
									domain: [0, 200],
									ticks: [0, 50, 100, 150, 200],
								}}
								interval={heartbeatInterval}
								onIntervalChange={setHeartbeatInterval}
								recommendedTarget={
									getTargets(METRIC_TYPE_ENUM.HEART_RATE).recommended
								}
								userTarget={getTargets(METRIC_TYPE_ENUM.HEART_RATE).user}
							/>
						)}
					</div>

					{/* Consultation Call-to-Action */}
					<div
						className="mt-10 flex items-center justify-between gap-4 p-6 rounded-xl"
						style={{
							background: "linear-gradient(135deg, #00453A 0%, #006B5C 100%)",
							boxShadow: "0 4px 12px rgba(0, 69, 58, 0.3)",
						}}
					>
						<div>
							<h3
								className="text-xl font-bold mb-2"
								style={{ color: "#FFFFFF" }}
							>
								Your 20-Minute Consultation
							</h3>
							<Button
								onClick={() => setLocation(ROUTES.INSTANT_CONSULTATION)}
								size="sm"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								Book Consultation
							</Button>
						</div>
						<img
							src="/figmaAssets/3d-chat-icon_148391-363 1.png"
							alt="Consultation"
							className="w-24 h-24 object-contain flex-shrink-0"
						/>
					</div>
				</div>
			</main>

			<AddMetricDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				metricType={selectedMetricType}
				value={metricValue}
				onValueChange={setMetricValue}
				bloodSugarReadingType={bloodSugarReadingType}
				onBloodSugarReadingTypeChange={setBloodSugarReadingType}
				onSubmit={handleSubmitLog}
				isSubmitting={addActivityLogsBatch.isPending}
			/>

			<GlucoseImageVerificationDialog
				open={verificationDialogOpen}
				onOpenChange={setVerificationDialogOpen}
				bloodSugarReading={extractedReading}
				imagePreview={uploadedImagePreview}
				onConfirm={handleConfirmReading}
				onCancel={handleCancelVerification}
				isSubmitting={addActivityLogsBatch.isPending}
				onReadingChange={setExtractedReading}
			/>

			<DailyQuickLogsModal
				open={dailyQuickLogsOpen}
				onOpenChange={setDailyQuickLogsOpen}
				onSubmit={(data) => {
					createDailyQuickLog.mutate(data, {
						onSuccess: () => setDailyQuickLogsOpen(false),
					});
				}}
				isSubmitting={createDailyQuickLog.isPending}
				initialData={{
					exercise: latestMetric?.quickLog
						?.exercise as QuickLogExerciseTypeEnumValues,
					diet: latestMetric?.quickLog?.diet as QuickLogDietTypeEnumValues,
					sleepDuration: latestMetric?.quickLog
						?.sleepDuration as QuickLogSleepDurationTypeEnumValues,
					medicines: latestMetric?.quickLog
						?.medicines as QuickLogMedicinesTypeEnumValues,
					stressLevel: latestMetric?.quickLog
						?.stressLevel as QuickLogStressLevelTypeEnumValues,
				}}
				logDate={new Date().toISOString().split("T")[0]}
			/>

			<UploadMedicalReportsModal
				open={medicalReportsModalOpen}
				onOpenChange={setMedicalReportsModalOpen}
				initialStep={medicalReportsInitialStep}
			/>
		</div>
	);
}
