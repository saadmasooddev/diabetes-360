import { clsx, type ClassValue } from "clsx";
import { connect, disconnect } from "extendable-media-recorder-wav-encoder";
import { twMerge } from "tailwind-merge";
import type { Slot } from "@/services/bookingService";
import type { AuthData, CustomerData, User } from "@/types/auth.types";
import { HEALTH_METRIC_SOURCE_ENUM, HealthMetricReading, USER_ROLES, type UserRole } from "@shared/schema";
import {
	ADMIN_DASHBOARD_PREFIX,
	AUTH_PREFIX,
	COMMON_PREFIX,
	DOCTOR_DASHBOARD_PREFIX,
	ROUTES,
	USER_DASHBOARD_PREFIX,
} from "@/config/routes";
import dayjs from "dayjs";
import { register } from "extendable-media-recorder";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export class DateManager {
	static formatDisplayDate(dateStr: string): string {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return d.toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
	static startOfDay(date: Date) {
		return dayjs(date).startOf("day").toDate();
	}

	static parseLocalDate(dateStr: string): Date {
		const parsed = dayjs(dateStr, "YYYY-MM-DD");
		if (!parsed.isValid()) {
			throw new Error(`Invalid date format: ${dateStr}`);
		}
		return parsed.toDate();
	}

	static formatDate(date: Date | string): string {
		return dayjs(date).format("YYYY-MM-DD");
	}

	static isToday(date: Date | string) {
		const today = dayjs();
		const providedDate = dayjs(date);
		const isToday = providedDate.isSame(today, "day");
		return isToday;
	}

	static isBeforeToday(date: string) {
		const today = dayjs();
		const providedDate = dayjs(date);
		const isBeforeToday = providedDate.isBefore(today, "day");
		return isBeforeToday;
	}
}
export const formatDate = (date: Date, formatStr: string): string => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	if (formatStr === "MMM dd, yyyy") {
		return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
	}
	if (formatStr === "yyyy-MM-dd") {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}
	return date.toLocaleDateString();
};


export const formatTime12 = (time: string): string => {
	if (!time) return "";

	// Extract hours and minutes
	let hours: number;
	let minutes: number;

	if (time.match(/^\d{2}:\d{2}$/)) {
		// Format: HH:MM
		const [h, m] = time.split(":").map(Number);
		hours = h;
		minutes = m;
	} else if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
		// Format: HH:MM:SS
		const [h, m] = time.split(":").map(Number);
		hours = h;
		minutes = m;
	} else {
		return time; // Return as-is if format is unrecognized
	}

	// Convert to 12-hour format
	const period = hours >= 12 ? "PM" : "AM";
	const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

	return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const convert12To24Hour = (time12: string): string => {
	if (!time12) return "";

	// Parse format: "HH:MM AM/PM" or "H:MM AM/PM"
	const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
	if (!match) {
		// If already in 24-hour format, return as-is
		if (time12.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
			return time12.includes(":") && time12.split(":").length === 2
				? `${time12}:00`
				: time12;
		}
		return "";
	}

	let hours = parseInt(match[1], 10);
	const minutes = parseInt(match[2], 10);
	const period = match[3].toUpperCase();

	if (hours === 12) {
		hours = period === "AM" ? 0 : 12;
	} else if (period === "PM") {
		hours += 12;
	}

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

export function parseDateToComponents(dateString: string): {
	day: string;
	month: string;
	year: string;
} {
	if (!dateString) return { day: "", month: "", year: "" };
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return { day: "", month: "", year: "" };
		return {
			day: String(date.getDate()).padStart(2, "0"),
			month: String(date.getMonth() + 1).padStart(2, "0"),
			year: String(date.getFullYear()),
		};
	} catch {
		return { day: "", month: "", year: "" };
	}
}

export function convertSlotTypeToLabel(type: string): string {
	if (type === "onsite") return "In Person";
	if (type === "online") return "Video Call";
	return type;
}

export function handleNumberInput(
	currentValue: string,
	newValue: string,
): string {
	if (newValue === "") {
		return "";
	}

	let sanitized = newValue.replace(/[^\d.]/g, "");

	if (currentValue === "0" && sanitized.length > 0) {
		if (
			sanitized.startsWith("0") &&
			sanitized.length > 1 &&
			sanitized[1] !== "."
		) {
			sanitized = sanitized.replace(/^0+/, "");
			if (sanitized === "") {
				sanitized = "0";
			}
		} else if (sanitized.length === 1 && /^\d$/.test(sanitized)) {
			return sanitized;
		}
	}

	if (
		sanitized.length > 1 &&
		sanitized.startsWith("0") &&
		sanitized[1] !== "."
	) {
		sanitized = sanitized.replace(/^0+/, "");
		if (sanitized === "") {
			sanitized = "0";
		}
	}

	const parts = sanitized.split(".");
	if (parts.length > 2) {
		sanitized = parts[0] + "." + parts.slice(1).join("");
	}

	return sanitized;
}

export function getTimePeriod(hour: number): string {
	if (hour >= 5 && hour < 12) return "Morning";
	if (hour >= 12 && hour < 17) return "Afternoon";
	if (hour >= 17 && hour < 21) return "Evening";
	return "Night";
}

export function groupSlotsByPeriod(slots: Slot[]): Map<string, Slot[]> {
	const grouped = new Map<string, Slot[]>();

	slots.forEach((slot) => {
		const hour = parseInt(slot.startTime.split(":")[0]);
		const period = getTimePeriod(hour);

		if (!grouped.has(period)) {
			grouped.set(period, []);
		}
		grouped.get(period)!.push(slot);
	});

	// Sort slots within each period by time
	grouped.forEach((slots, period) => {
		slots.sort((a, b) => {
			const timeA = a.startTime;
			const timeB = b.startTime;
			return timeA.localeCompare(timeB);
		});
	});

	return grouped;
}

class Utils {
	readonly adminRoutes = Object.values(ROUTES).filter((r) =>
		r.startsWith(ADMIN_DASHBOARD_PREFIX),
	);
	readonly doctorRoutes = Object.values(ROUTES).filter((r) =>
		r.startsWith(DOCTOR_DASHBOARD_PREFIX),
	);
	readonly userRoutes = Object.values(ROUTES).filter((r) =>
		r.startsWith(USER_DASHBOARD_PREFIX),
	);
	readonly commonRoutes = Object.values(ROUTES).filter((r) =>
		r.startsWith(COMMON_PREFIX),
	);
	readonly authRoutes = Object.values(ROUTES).filter((r) =>
		r.startsWith(AUTH_PREFIX),
	);

	readonly roleAfterAuthNavigationMap: Record<
		UserRole,
		(data: AuthData, navigate: (p: string) => void) => void
	> = {
		[USER_ROLES.CUSTOMER]: (data, navigate) => {
			if (!data.user.profileComplete) {
				return navigate(ROUTES.PROFILE_DATA);
			}
			navigate(ROUTES.HOME);
			return;
		},
		[USER_ROLES.PHYSICIAN]: (data, navigate) => {
			navigate(ROUTES.DOCTOR_HOME);
		},
		[USER_ROLES.ADMIN]: (data, navigate) => {
			navigate(ROUTES.ADMIN_HOME);
		},
	};

	addToHealthMetricReading(array: HealthMetricReading[], value: number, recordedAt?: string, source?: HEALTH_METRIC_SOURCE_ENUM){
		array.push({
			value,
			recordedAt: recordedAt || new Date().toISOString(),
			readingSource: source || HEALTH_METRIC_SOURCE_ENUM.CUSTOM
		})
	}
}
export function sortLocationByDistance(
	locations: { id: string; locationName: string }[],
	locationDistances: Record<string, number>,
) {
	return locations.sort((a, b) => {
		const distA = locationDistances[a.id];
		const distB = locationDistances[b.id];

		if (distA !== undefined && distB !== undefined) {
			return distA - distB;
		}
		if (distA !== undefined) return -1;
		if (distB !== undefined) return 1;
		return a.locationName.localeCompare(b.locationName);
	});
}

class CalorieUtils {
	/**
	 * Calculate calories burned for an activity based on user info
	 * Uses MET (Metabolic Equivalent of Task) values
	 * Formula: Calories = MET × weight(kg) × duration(hours)
	 *
	 * @param userInfo - User information including weight, height, birthday, and gender
	 * @param activityType - Type of activity ('walking' | 'yoga')
	 * @param durationSeconds - Duration of activity in seconds
	 * @returns Estimated calories burned (rounded to nearest integer)
	 */
	calculateCaloriesBurned(
		userInfo: {
			weight: string; // in kg (e.g., "70")
			height: string; // in cm (e.g., "175")
			birthday: string; // ISO date string
			gender: "male" | "female";
		},
		activityType: "walking" | "yoga",
		durationSeconds: number,
	): number {
		// Parse weight (remove 'kg' if present, or use as-is)
		const weight = parseFloat(userInfo.weight.replace(/kg/gi, "").trim());
		if (isNaN(weight) || weight <= 0) {
			// Default to 70kg if weight is invalid
			console.warn("Invalid weight, using default 70kg");
			return this.calculateCaloriesBurned(
				{ ...userInfo, weight: "70" },
				activityType,
				durationSeconds,
			);
		}

		// Calculate age from birthday
		const birthDate = new Date(userInfo.birthday);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}

		// Convert duration from seconds to hours
		const durationHours = durationSeconds / 3600;

		// MET values (Metabolic Equivalent of Task)
		// Walking (moderate pace, 3-4 mph): ~3.8 METs
		// Yoga (Hatha yoga, general): ~2.5 METs
		const metValues: Record<"walking" | "yoga", number> = {
			walking: 3.8, // Moderate pace walking
			yoga: 2.5, // Hatha yoga, general
		};

		const met = metValues[activityType] || 3.0; // Default to 3.0 if unknown

		// Calculate calories: MET × weight(kg) × duration(hours)
		const calories = met * weight * durationHours;

		// Round to nearest integer
		return Math.round(calories);
	}

	// Calculate stride length in meters based on height, gender, and activity type
	// Walking: male = heightCm × 0.415 / 100, female = heightCm × 0.413 / 100
	// Running: male = heightCm × 0.65 / 100, female = heightCm × 0.62 / 100
	calculateStrideLength(
		heightCm?: string | number,
		gender?: string,
		activityType?: string,
	): number {
		if (!heightCm) return 0;

		const height =
			typeof heightCm === "string" ? parseFloat(heightCm) : heightCm;
		if (isNaN(height) || height <= 0) return 0;

		const isMale =
			gender?.toLowerCase() === "male" || gender?.toLowerCase() === "m";
		const isRunning = activityType === "running";

		// Stride length formulas as specified:
		// Walking: male = heightCm × 0.415 / 100, female = heightCm × 0.413 / 100
		// Running: male = heightCm × 0.65 / 100, female = heightCm × 0.62 / 100
		let strideLengthMeters = 0;

		if (isRunning) {
			strideLengthMeters = isMale
				? (height * 0.65) / 100
				: (height * 0.62) / 100;
		} else {
			// Walking
			strideLengthMeters = isMale
				? (height * 0.415) / 100
				: (height * 0.413) / 100;
		}

		return strideLengthMeters;
	}

	// Calculate accurate steps based on distance, user data, and activity type
	calculateAccurateSteps(
		distanceMeters: number,
		user?: User | null,
		activityType?: string,
	): number {
		if (distanceMeters <= 0) return 0;

		// For cycling, return 0 steps
		if (activityType === "cycling") return 0;

		const profileData = user?.profileData as CustomerData;
		const strideLength = this.calculateStrideLength(
			profileData?.height,
			profileData?.gender,
			activityType,
		);

		// If we have valid stride length, use it; otherwise fall back to default
		if (strideLength > 0) {
			return Math.round(distanceMeters / strideLength);
		}

		// Fallback to default calculations if user data is missing
		const distanceKm = distanceMeters / 1000;
		let stepsPerKm = 1400; // Default walking

		if (activityType === "running") {
			stepsPerKm = 1100;
		}

		return Math.round(distanceKm * stepsPerKm);
	}

	// Calculate accurate pace (minutes per kilometer)
	// Formula: pace = (totalDurationSeconds / 60) / (totalDistanceMeters / 1000)
	calculateAccuratePace(
		distanceMeters: number,
		durationSeconds: number,
		user?: User | null,
		activityType?: string,
	): number {
		if (distanceMeters <= 0 || durationSeconds <= 0) return 0;

		// Pace calculation: (totalDurationSeconds / 60) / (totalDistanceMeters / 1000)
		const paceMinutes = durationSeconds / 60 / (distanceMeters / 1000);

		return paceMinutes;
	}

	// Calculate calories using MET-based formula
	// MET values based on activity type and pace:
	// Walking: pace > 12 → 2.8, pace > 9 → 3.5, else 3.8
	// Running: pace > 7 → 8.3, pace > 5 → 9.8, else 11.0
	// Yoga: 2.5 MET (light intensity)
	// Stretching: 2.3 MET (light intensity)
	// Calories = MET × weightKg × (totalDurationSeconds / 3600)
	calculateCalories(
		distanceMeters: number,
		durationSeconds: number,
		user?: User | null,
		activityType?: string,
	): number {
		if (durationSeconds <= 0) return 0;

		// Get user weight
		const profileData = user?.profileData as CustomerData;
		const weightStr = profileData?.weight;
		if (!weightStr) return 0;

		const weightKg =
			typeof weightStr === "string" ? parseFloat(weightStr) : weightStr;
		if (isNaN(weightKg) || weightKg <= 0) return 0;

		// Determine MET value based on activity type
		let met = 0;

		if (activityType === "yoga") {
			met = 2.5; // Light intensity yoga
		} else if (activityType === "stretching") {
			met = 2.3; // Light intensity stretching
		} else if (activityType === "running") {
			// Running MET values: pace > 7 → 8.3, pace > 5 → 9.8, else 11.0
			if (distanceMeters > 0) {
				const paceMinutes = this.calculateAccuratePace(
					distanceMeters,
					durationSeconds,
					user,
					activityType,
				);
				if (paceMinutes > 7) {
					met = 8.3;
				} else if (paceMinutes > 5) {
					met = 9.8;
				} else {
					met = 11.0;
				}
			} else {
				met = 8.3; // Default moderate running
			}
		} else {
			// Walking MET values: pace > 12 → 2.8, pace > 9 → 3.5, else 3.8
			if (distanceMeters > 0) {
				const paceMinutes = this.calculateAccuratePace(
					distanceMeters,
					durationSeconds,
					user,
					activityType,
				);
				if (paceMinutes > 12) {
					met = 2.8;
				} else if (paceMinutes > 9) {
					met = 3.5;
				} else {
					met = 3.8;
				}
			} else {
				met = 3.5; // Default moderate walking
			}
		}

		// Calculate calories: MET × weightKg × (totalDurationSeconds / 3600)
		const calories = met * weightKg * (durationSeconds / 3600);

		return Math.round(calories * 10) / 10; // Round to 1 decimal place
	}

	// Calculate calories for yoga/stretching (no distance required)
	calculateYogaCalories(
		durationSeconds: number,
		user?: User | null,
		activityType?: string,
	): number {
		return this.calculateCalories(0, durationSeconds, user, activityType);
	}

	// Generate morning walk activity metrics summary
	generateMorningWalkMetrics(
		totalDuration: number,
		totalDistance: number,
		user?: User | null,
		activityType?: string,
		sessionSummary?: {
			totalDistance?: number;
			totalDuration?: number;
			avgPace?: number;
		},
	): {
		totalDuration: number;
		totalDistance: number;
		totalCaloriesBurned: number;
		totalSteps: number;
		totalPace: number;
		hours: number;
		minutes: number;
		seconds: number;
	} {
		// Get final values before resetting (use sessionSummary as fallback)
		const finalTotalDuration =
			totalDuration || sessionSummary?.totalDuration || 0;
		const finalTotalDistance =
			totalDistance || sessionSummary?.totalDistance || 0;

		// Recalculate final pace and calories for accuracy
		const finalPace = this.calculateAccuratePace(
			finalTotalDistance,
			finalTotalDuration,
			user,
			activityType,
		);
		const finalCalories = this.calculateCalories(
			finalTotalDistance,
			finalTotalDuration,
			user,
			activityType,
		);
		const finalSteps = this.calculateAccurateSteps(
			finalTotalDistance,
			user,
			activityType,
		);

		// Convert total duration to hours, minutes, seconds
		const hours = Math.floor(finalTotalDuration / 3600);
		const minutes = Math.floor((finalTotalDuration % 3600) / 60);
		const seconds = Math.floor(finalTotalDuration % 60);

		// Return all metrics
		return {
			totalDuration: finalTotalDuration,
			totalDistance: finalTotalDistance,
			totalCaloriesBurned: finalCalories,
			totalSteps: finalSteps,
			totalPace: finalPace,
			hours,
			minutes,
			seconds,
		};
	}

	// Generate yoga/stretching activity metrics summary
	generateYogaStretchingMetrics(
		totalDuration: number,
		calories: number,
		user?: User | null,
		activityType?: string,
	): {
		totalDuration: number;
		totalCalories: number;
		hours: number;
		minutes: number;
		seconds: number;
	} {
		// Get final values before resetting
		const finalTotalDuration = totalDuration || 0;
		const finalCalories = calories || 0;

		// Recalculate final calories for accuracy
		const recalculatedCalories = this.calculateYogaCalories(
			finalTotalDuration,
			user,
			activityType,
		);
		const finalTotalCalories = finalCalories || recalculatedCalories || 0;

		// Convert total duration to hours, minutes, seconds
		const hours = Math.floor(finalTotalDuration / 3600);
		const minutes = Math.floor((finalTotalDuration % 3600) / 60);
		const seconds = Math.floor(finalTotalDuration % 60);

		// Return summary with total duration and total calories
		return {
			totalDuration: finalTotalDuration,
			totalCalories: finalTotalCalories,
			hours,
			minutes,
			seconds,
		};
	}

	getEstimatedCaloriesBurnedForSteps(steps: number) {
		return steps * 0.05;
	}

	getEstimatedDurationForSteps(steps: number) {
		return steps * 1;
	}

	getDistanceKm(steps: number, user: User): number {
		const strideLengthCm = this.calculateStrideLength(user.profileData?.height);
		const distance = (steps * strideLengthCm) / 100000;
		return this.round2(distance); // km
	}

	getDurationMinutes(distanceKm: number): number {
		const walkingSpeedKmH = 5;
		const duration = (distanceKm / walkingSpeedKmH) * 60;
		return duration ? Math.ceil(duration) : duration; // minutes
	}

	getPaceMinutesPerKm(durationMinutes: number, distanceKm: number): number {
		const pace = distanceKm > 0 ? durationMinutes / distanceKm : 0;
		return this.round2(pace);
	}

	getEstimatedCaloriesBurned(steps: number, user: User): number {
		const weight = Number(user?.profileData?.weight || 0);
		const distanceKm = this.getDistanceKm(steps, user);
		const duration = this.getDurationMinutes(distanceKm);

		const walkingMET = 3.5;
		const caloriesPerMinute = (walkingMET * 3.5 * weight) / 200;

		const calories = caloriesPerMinute * duration;
		return this.round2(calories);
	}

	round2(value: number): number {
		return Math.round(value * 100) / 100;
	}
}

export class GeneralUtils {

	private wavEncoderRegistered = false;

	async ensureWavEncoderRegistered(): Promise<void> {
		if (this.wavEncoderRegistered) return;
		const port = await connect();
		await register(port);
		this.wavEncoderRegistered = true;
	}
}

export const generalUtils = new GeneralUtils()
export const calorieUtils = new CalorieUtils();
export const utils = new Utils();

