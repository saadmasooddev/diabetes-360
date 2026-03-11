import { useState, useMemo } from "react";
import {
	HealthTrendChart,
	getDateRange,
	getFilteredMetricsQueryKeys,
} from "./HealthTrendChart";
import { useFilteredMetrics } from "@/hooks/mutations/useHealth";
import { useTargetsForUser } from "@/hooks/mutations/useHealth";
import { formatDate } from "@/lib/utils";
import { METRIC_TYPE_ENUM } from "@shared/schema";
import { API_ENDPOINTS } from "@/config/endpoints";

type IntervalType = "daily" | "weekly" | "monthly";

export function GlucoseChartSection() {
	const [interval, setInterval] = useState<IntervalType>("daily");
	const { data: targets } = useTargetsForUser();

	const dateRange = getDateRange(interval);
	const bloodGlucoseQueryKey = getFilteredMetricsQueryKeys(
		METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
		dateRange,
	);
	const { data: glucoseMetrics, isLoading } =
		useFilteredMetrics(bloodGlucoseQueryKey);

	const formatTimeLabel = (date: Date, interval: IntervalType): string => {
		if (interval === "daily") {
			const hours = date.getHours();
			const minutes = date.getMinutes();
			const period = hours >= 12 ? "PM" : "AM";
			const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
			return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""} ${period}`;
		} else if (interval === "weekly") {
			const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
			return `${days[date.getDay()]} ${date.getDate()}`;
		} else {
			return `${date.getMonth() + 1}/${date.getDate()}`;
		}
	};

	const glucoseData = useMemo(() => {
		if (!glucoseMetrics?.bloodSugarRecords?.length) return [];

		return [...glucoseMetrics.bloodSugarRecords].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, interval),
				value: m.value || 0,
			};
		});
	}, [glucoseMetrics, interval]);

	const getTargets = () => {
		const recommended = targets?.recommended.find(
			(t) => t.metricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
		);
		const user = targets?.user.find(
			(t) => t.metricType === METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
		);

		return {
			recommended: recommended
				? parseFloat(recommended.targetValue)
				: undefined,
			user: user ? parseFloat(user.targetValue) : undefined,
		};
	};

	const targetValues = getTargets();

	return (
		<HealthTrendChart
			title="Glucose Logs"
			data={glucoseData}
			gradientId="glucoseGradient"
			testId="chart-glucose-logs"
			height={250}
			yAxisConfig={{
				domain: [0, 200],
				ticks: [0, 50, 100, 150, 200],
				label: "mg/dL",
			}}
			interval={interval}
			onIntervalChange={setInterval}
			recommendedTarget={targetValues.recommended}
			userTarget={targetValues.user}
		/>
	);
}
