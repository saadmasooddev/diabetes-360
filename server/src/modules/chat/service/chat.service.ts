import { ChatRepository } from "../repository/chat.repository";
import { CustomerRepository } from "../../customer/repository/customer.repository";
import { HealthRepository } from "../../health/repository/health.repository";
import { FoodRepository } from "../../food/repository/food.repository";
import { aiService } from "../../../shared/services/ai.service";
import type {
	AIChatPayload,
	LastDaysHealthSummaryPayload,
	OldChatMemoryPayload,
	EmotionalStatePayload,
} from "../../../shared/services/ai.service";
import { EXERCISE_TYPE_ENUM } from "../../health/models/health.schema";
import { DIABETES_TYPE } from "../../auth/models/user.schema";
import {
	CHAT_ROLES,
	type ChatMessage,
	type ChatRole,
} from "../models/chat.schema";
import type { MertricRecord } from "../../health/models/health.schema";
import type { LoggedMeal } from "../../food/models/food.schema";
import { DateManager } from "server/src/shared/utils/utils";
import { PatientRepository } from "../../physician/repository/patient.repository";
import { PATIENT_INDICATION } from "../../physician/utils/patientColors";
import dayjs from "dayjs";

export class ChatService {
	private chatRepo = new ChatRepository();
	private customerRepo = new CustomerRepository();
	private healthRepo = new HealthRepository();
	private foodRepo = new FoodRepository();

	private readonly DIABETES_TYPE_LABELS: Record<string, string> = {
		[DIABETES_TYPE.TYPE1]: "Type 1",
		[DIABETES_TYPE.TYPE2]: "Type 2",
		[DIABETES_TYPE.GESTATIONAL]: "Gestational",
		[DIABETES_TYPE.PREDIABETES]: "Prediabetes",
	};

	private readonly EMOTIONAL_STATE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
	private readonly MIN_WORDS_FOR_EMOTIONAL_CHECK = 4;
	private readonly NOISE_WORDS_REGEX =
		/\b(ok(ay)?|oka|k|hmm+|yes|no|yep|nope|yeah|nah|acha|theek|thanks?|thank\s*you|haan|ha|nahi|nai|theek\s*hai|bilkul|ji\s*haan|ji\s*nahi|sahi|accha|thik|thik\s*hai|han|na|ji|haanji|nahi\s*ji|cool|fine|good|great|alright|sure|right|got\s*it|understood|okie|kay)\b|[\u{1F44D}\u{1F642}\u{1F600}\u{1F601}\u{2705}\u{274C}]/giu;

	private readonly SAD_KEYWORDS_REGEX =
		/\b(thak\w*|tired\w*|stress\w*|pareshan\w*|frustrat\w*|fed\s*up\w*|anxious\w*|overwhelm\w*|sad\w*|low\w*|depress\w*|exhaust\w*|burnout\w*|tension\w*|ghabrahat\w*|udaas\w*|bechain\w*|takat\s*nahi\w*|kamzor\w*|weak\w*|hopeless\w*|niraash\w*|dil\s*tut\w*|dukhi\w*|afsoos\w*|chinta\w*|worr?y\w*|nervous\w*|scared\w*|darr\w*|daraavna\w*|takleef\w*|pain\w*|dard\w*)\b/giu;
	private readonly HAPPY_KEYWORDS_REGEX =
		/\b(happy\w*|excited\w*|joyful\w*|ecstatic\w*|elated\w*|thrilled\w*|overjoyed\w*|blissful\w*|content\w*|satisfied\w*|pleased\w*|delighted\w*|cheerful\w*|glad\w*|pleased\w*|satisfied\w*|happy\w*|excited\w*|joyful\w*|ecstatic\w*|elated\w*|thrilled\w*|overjoyed\w*|blissful\w*|content\w*|satisfied\w*|pleased\w*|delighted\w*|cheerful\w*|glad\w*)\b/giu;
	private readonly NEUTRAL_KEYWORDS_REGEX =
		/\b((o?k(ay)?|al[\s-]?right|average|normal(ly)?|neutral|meh+|routine|typical|regular|fine|nothing\s*(much|special|new)?|so\s*so|not\s*bad|not\s*great|fair(\s*enough)?|decent|same(\s*old)?|as\s*usual|nothing\s*to\s*report|middle(\s*of\s*the\s*road)?|no\s*change|standard|just\s*okay?|just\s*alright|okayish|alrighty|unremarkable)\b)/giu;

	private mealToPayload(
		m: LoggedMeal,
	): AIChatPayload["health_summary"]["last_24_hours"]["meals"][0] {
		const mealDate = m.mealDate;

		return {
			mealDate,
			foodName: m.foodName,
			carbs: String(m.carbs ?? "0"),
			sugars: String(m.sugars ?? "0"),
			fibres: String(m.fibres ?? "0"),
			proteins: String(m.proteins ?? "0"),
			fats: String(m.fats ?? "0"),
			calories: String(m.calories ?? "0"),
		};
	}

	private toRecordedValue(
		records: MertricRecord[],
	): Array<{ value: string; recorded_at: string }> {
		return records
			.filter((r) => r.value != null && String(r.value).trim() !== "")
			.map((r) => ({
				value: String(r.value),
				recorded_at:
					r.recordedAt instanceof Date
						? r.recordedAt.toISOString()
						: String(r.recordedAt),
			}));
	}

	private toSummaryMetricValues(
		records: MertricRecord[],
	): Array<{ value: string }> {
		return records
			.filter((r) => r.value != null && String(r.value).trim() !== "")
			.map((r) => ({ value: String(r.value) }));
	}

	private filterNoise(message: string): string {
		const cleaned = message.replace(this.NOISE_WORDS_REGEX, " ");
		return cleaned.replace(/\s+/g, " ").trim();
	}

	private wordCount(str: string): number {
		if (!str) return 0;
		return str.split(/\s+/).filter((s) => s.length > 0).length;
	}

	private hasEmotionalKeyword(message: string): boolean {
		const emotionalRegexes = [
			this.SAD_KEYWORDS_REGEX,
			this.HAPPY_KEYWORDS_REGEX,
			this.NEUTRAL_KEYWORDS_REGEX,
		];

		for (const regex of emotionalRegexes) {
			regex.lastIndex = 0;
			if (regex.test(message)) {
				return true;
			}
		}
		return false;
	}

	private readonly MIN_STEPS_FOR_ACTIVITY = 2000;
	private readonly LATE_DINNER_HOUR = 21; // 9 PM
	private readonly LATE_DINNER_CONSECUTIVE_DAYS = 3;
	private readonly MISSED_LOGS_DAYS_THRESHOLD = 2;
	private readonly MISSED_LOGS_LOOKBACK_DAYS = 7;

	/**
	 * Build behavior_patterns for the /chat/ payload.
	 * - late_dinner: true if user logged a meal after 9PM for 3+ consecutive days.
	 * - evening_inactivity: true if previous day steps < 2000.
	 * - missed_logs_frequency: "yes" if in last 7 days user missed logging meals for 2+ days OR glucose for 2+ days (non-consecutive).
	 */
	private async buildBehaviorPatterns(
		userId: string,
		dateStr: string,
	): Promise<AIChatPayload["behavior_patterns"]> {
		const base = dayjs(dateStr);
		const startThree = base.subtract(3, "day");
		const prevDay = base.subtract(1, "day").format("YYYY-MM-DD");

		const [mealsInRange, prevDaySteps, sevenDayMealsAndGlucose] =
			await Promise.all([
				this.foodRepo.getLoggedMealsInDateRange(
					userId,
					startThree.format("YYYY-MM-DD"),
					dateStr,
				),
				this.healthRepo.getTodaysMetricTotal(
					userId,
					EXERCISE_TYPE_ENUM.STEPS,
					prevDay,
				),
				Promise.all(
					Array(this.MISSED_LOGS_LOOKBACK_DAYS)
						.fill(null)
						.map(async (_, i) => {
							const d = base.subtract(i, "day").format("YYYY-MM-DD");
							const [meals, metrics] = await Promise.all([
								this.foodRepo.getLoggedMealsByDate(userId, d),
								this.healthRepo.getFilteredMetrics(userId, d, d, [
									EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE,
								]),
							]);
							return {
								date: d,
								hasMeals: meals.length > 0,
								hasGlucose: metrics.bloodSugarRecords.length > 0,
							};
						}),
				),
			]);

		// late_dinner: 3+ consecutive days with at least one meal logged after 9PM (by createdAt)
		const daysWithLateMeal = new Set<string>();
		for (const m of mealsInRange) {
			const { localHours, date: d } = DateManager.getLocalHours(
				m.recordedAt,
				m.timeZone,
			);
			if (
				localHours &&
				!isNaN(localHours) &&
				localHours >= this.LATE_DINNER_HOUR
			) {
				daysWithLateMeal.add(d.format("YYYY-MM-DD"));
			}
		}
		const sortedDays = Array.from(daysWithLateMeal).sort();
		let maxConsecutive = 0;
		let current = 0;
		for (let i = 0; i < sortedDays.length; i++) {
			if (
				i === 0 ||
				dayjs(sortedDays[i]).diff(dayjs(sortedDays[i - 1]), "day") === 1
			) {
				current = i === 0 ? 1 : current + 1;
			} else {
				current = 1;
			}
			maxConsecutive = Math.max(maxConsecutive, current);
		}
		const late_dinner = maxConsecutive >= this.LATE_DINNER_CONSECUTIVE_DAYS;

		// evening_inactivity: previous day steps < 2000
		const evening_inactivity = prevDaySteps < this.MIN_STEPS_FOR_ACTIVITY;

		// missed_logs_frequency: last 7 days, 2+ days with no meals OR 2+ days with no glucose
		const daysWithoutMeals = sevenDayMealsAndGlucose.filter(
			(d) => !d.hasMeals,
		).length;
		const daysWithoutGlucose = sevenDayMealsAndGlucose.filter(
			(d) => !d.hasGlucose,
		).length;
		const missed_logs_frequency =
			daysWithoutMeals >= this.MISSED_LOGS_DAYS_THRESHOLD ||
			daysWithoutGlucose >= this.MISSED_LOGS_DAYS_THRESHOLD
				? "yes"
				: "no";

		return {
			late_dinner,
			evening_inactivity,
			missed_logs_frequency,
		};
	}

	private readonly NUDGE_STABLE_3_DAYS = [
		"Your readings have been stable for the past 3 days. Great job.",
		"It looks like your routine is working. Keep maintaining this flow.",
		"Consistency is building. Small habits are starting to make a difference.",
		"Your routine is looking good. Keep maintaining this flow.",
		"Your readings have been stable for the past 3 days. Great job.",
		"It looks like your routine is working. Keep maintaining this flow.",
		"Consistency is building. Small habits are starting to make a difference.",
		"Your routine is looking good. Keep maintaining this flow.",
	];
	private readonly NUDGE_GENTLE_CHECKIN = [
		"Your readings have been a bit high for the past two days. Is everything okay?",
		"Taking it a little easy today might help. No pressure.",
		"Spikes happen sometimes. A short walk today could be helpful.",
		"Your readings have been a bit high for the past two days. Is everything okay?",
	];
	private readonly NUDGE_SILENCE = [
		"We haven't seen an update for a few days. Just checking in—are you okay?",
		"This is a gentle check-in. Update whenever you feel ready.",
		"We haven't seen an update for a few days. Just checking in—are you okay?",
		"This is a gentle check-in. Update whenever you feel ready.",
		"If you're taking a break, that's completely fine. We're here when you need us.",
	];
	private readonly NUDGE_POST_IMPROVEMENT = [
		"Your reading was better yesterday. It looks like your efforts are paying off.",
		"Nice recovery. Keep up the small, consistent steps.",
	];
	private readonly NUDGE_ACTION_BASED = [
		"If you can fit in a short 10-minute walk today, it could help strengthen the trend.",
		"Your routine looks good. Adding a bit of movement may help.",
	];

	/**
	 * Pick a random nudge when user first visits DiaBot (no messages today).
	 * Priority: 5 days no data > 2 consecutive high > 3 days stable > post-improvement > stable + low activity.
	 */
	private async getNudge(
		userId: string,
		dateStr: string,
	): Promise<string | null> {
		const base = dayjs(dateStr);
		const daysBack = 7;
		const [glucoseResult, stepsResult] = await Promise.all([
			this.healthRepo.getFilteredMetrics(
				userId,
				base.subtract(daysBack, "day").format("YYYY-MM-DD"),
				dateStr,
				[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE],
			),
			this.healthRepo.getFilteredMetrics(
				userId,
				base.subtract(5, "day").format("YYYY-MM-DD"),
				dateStr,
				[EXERCISE_TYPE_ENUM.STEPS],
			),
		]);

		const bloodSugarByDay = new Map<
			string,
			Array<{ value: number; indication: PATIENT_INDICATION }>
		>();
		for (const r of glucoseResult.bloodSugarRecords) {
			const d = dayjs(r.recordedAt).format("YYYY-MM-DD");
			const val =
				typeof r.value === "string" ? parseFloat(r.value) : Number(r.value);
			if (Number.isFinite(val)) {
				const list = bloodSugarByDay.get(d) ?? [];
				list.push({
					value: val,
					indication: PatientRepository.bloodSugarAlert(val),
				});
				bloodSugarByDay.set(d, list);
			}
		}
		const stepsByDay = new Map<string, number>();
		for (const r of stepsResult.stepsRecords) {
			const d = dayjs(r.recordedAt).format("YYYY-MM-DD");
			const val =
				typeof r.value === "string" ? parseFloat(r.value) : Number(r.value);
			const current = stepsByDay.get(d) ?? 0;
			stepsByDay.set(d, current + (Number.isFinite(val) ? val : 0));
		}

		const orderedDays = Array.from({ length: 6 }, (_, i) =>
			base.subtract(i, "day").format("YYYY-MM-DD"),
		);
		const hasData = (d: string) => (bloodSugarByDay.get(d)?.length ?? 0) > 0;
		const dayStatus = (d: string) => {
			const readings = bloodSugarByDay.get(d) ?? [];
			const worst = readings.reduce<PATIENT_INDICATION>(
				(acc, { indication }) => {
					if (indication === PATIENT_INDICATION.HIGH_RISK)
						return PATIENT_INDICATION.HIGH_RISK;
					if (
						indication === PATIENT_INDICATION.NEEDS_ATTENTION &&
						acc !== PATIENT_INDICATION.HIGH_RISK
					)
						return PATIENT_INDICATION.NEEDS_ATTENTION;
					return acc;
				},
				PATIENT_INDICATION.STABLE,
			);
			return {
				stable: worst === PATIENT_INDICATION.STABLE,
				high: worst !== PATIENT_INDICATION.STABLE,
			};
		};

		// 5 days no data: last 5 days (including today) have no glucose logged
		const last5Days = orderedDays.slice(0, 5);
		if (last5Days.every((d) => !hasData(d))) {
			return this.NUDGE_SILENCE[
				Math.floor(Math.random() * this.NUDGE_SILENCE.length)
			];
		}

		// 2 consecutive high readings (yesterday and day before)
		const d1 = orderedDays[1];
		const d2 = orderedDays[2];
		if (d1 && d2 && dayStatus(d1).high && dayStatus(d2).high) {
			return this.NUDGE_GENTLE_CHECKIN[
				Math.floor(Math.random() * this.NUDGE_GENTLE_CHECKIN.length)
			];
		}

		// 3 days stable (last 3 days with data, all stable)
		const last3 = orderedDays.slice(0, 3);
		if (
			last3.every((d) => hasData(d)) &&
			last3.every((d) => dayStatus(d).stable)
		) {
			return this.NUDGE_STABLE_3_DAYS[
				Math.floor(Math.random() * this.NUDGE_STABLE_3_DAYS.length)
			];
		}

		// Post-improvement: day before yesterday high, yesterday stable
		const dayBefore = orderedDays[2];
		const yesterday = orderedDays[1];
		if (
			dayBefore &&
			yesterday &&
			dayStatus(dayBefore).high &&
			dayStatus(yesterday).stable &&
			hasData(yesterday)
		) {
			return this.NUDGE_POST_IMPROVEMENT[
				Math.floor(Math.random() * this.NUDGE_POST_IMPROVEMENT.length)
			];
		}

		// Action-based: stable readings with low activity (yesterday stable, steps < 2000)
		const yesterdaySteps = yesterday ? (stepsByDay.get(yesterday) ?? 0) : 0;
		if (
			yesterday &&
			dayStatus(yesterday).stable &&
			hasData(yesterday) &&
			yesterdaySteps < this.MIN_STEPS_FOR_ACTIVITY
		) {
			return this.NUDGE_ACTION_BASED[
				Math.floor(Math.random() * this.NUDGE_ACTION_BASED.length)
			];
		}

		return null;
	}

	private async buildTodayDataForSummary(
		userId: string,
		dateStr: string,
	): Promise<LastDaysHealthSummaryPayload> {
		const [metricsResult, meals] = await Promise.all([
			this.healthRepo.getFilteredMetrics(userId, dateStr, dateStr, [
				EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE,
				EXERCISE_TYPE_ENUM.STEPS,
				EXERCISE_TYPE_ENUM.WATER_INTAKE,
				EXERCISE_TYPE_ENUM.HEART_RATE,
			]),
			this.foodRepo.getLoggedMealsByDate(userId, dateStr),
		]);

		const recordedAt = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`;

		return {
			today_data: {
				recorded_at: recordedAt,
				blood_sugar: this.toSummaryMetricValues(
					metricsResult.bloodSugarRecords,
				),
				steps: this.toSummaryMetricValues(metricsResult.stepsRecords),
				water_intake: this.toSummaryMetricValues(
					metricsResult.waterIntakeRecords,
				),
				heart_rate: this.toSummaryMetricValues(metricsResult.heartBeatRecords),
				meals: meals.map((m) => ({
					foodName: m.foodName,
					carbs: m.carbs,
					sugars: m.sugars,
					fibres: m.fibres,
					proteins: m.proteins,
					fats: m.fats,
					calories: m.calories,
				})),
			},
		};
	}

	async generateAndStoreDailySummaryJob() {
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const dateStr = DateManager.formatDate(yesterday);
		const usersWithChatOnDate =
			await this.chatRepo.getDistinctUserIdsWithChatOnDate(dateStr);

		for (const { userId } of usersWithChatOnDate) {
			const [existing, hasChat] = await Promise.all([
				this.chatRepo.getSummaryByUserAndDate(userId, dateStr),
				this.chatRepo.hasChatForDate(userId, dateStr),
			]);
			if (existing) continue;
			if (!hasChat) continue;

			const payload = await this.buildTodayDataForSummary(userId, dateStr);
			const response = await aiService.getLastDaysHealthSummary(payload);
			const summary = response.data?.last_day_summary;
			if (!summary || typeof summary !== "string") {
				throw new Error("Summary is not a string");
			}

			await this.chatRepo.insertDailySummary({
				userId,
				summaryDate: dateStr,
				summary,
			});
		}
	}

	async extractAndStoreChatMemoriesJob() {
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const dateStr = DateManager.formatDate(yesterday);

		const usersWithChatOnDate =
			await this.chatRepo.getDistinctUserIdsWithChatOnDate(dateStr);

		for (const { userId } of usersWithChatOnDate) {
			const messages = await this.chatRepo.getByUserAndDate(userId, dateStr);
			if (messages.length === 0) continue;

			const payload: OldChatMemoryPayload = {
				messages: messages.map((m) => ({
					role: m.role as CHAT_ROLES,
					content: m.message,
				})),
			};

			const response = await aiService.getOldChatMemory(payload);
			const suggestedMemories = response.data?.suggested_memories ?? [];
			if (!Array.isArray(suggestedMemories)) {
				throw new Error("Suggested memories is not an array");
			}
			const valid = suggestedMemories.filter(
				(m): m is string => typeof m === "string",
			);

			await this.chatRepo.upsertChatMemories(userId, dateStr, valid);
		}
	}

	async getChatByDate(
		userId: string,
		dateStr: string,
	): Promise<{ messages: ChatMessage[]; nudge?: string }> {
		const messages = await this.chatRepo.getByUserAndDate(userId, dateStr);
		const nudgeRaw =
			messages.length === 0 ? await this.getNudge(userId, dateStr) : undefined;
		const nudge = nudgeRaw ?? undefined;
		return { messages, nudge };
	}

	async sendMessage(
		userId: string,
		dateStr: string,
		message: string,
		recordedAt: string,
	): Promise<{ assistantMessage: string }> {
		const trimmed = message.trim();
		if (trimmed === "") {
			throw new Error("Message cannot be empty");
		}

		const [
			customerData,
			chatHistory,
			metricsResult,
			meals,
			lastDaysSummaries,
			oldChatMemory,
		] = await Promise.all([
			this.customerRepo.getCustomerDataByUserId(userId),
			this.chatRepo.getByUserAndDate(userId, dateStr),
			this.healthRepo.getFilteredMetrics(userId, dateStr, dateStr, [
				EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE,
				EXERCISE_TYPE_ENUM.STEPS,
				EXERCISE_TYPE_ENUM.WATER_INTAKE,
				EXERCISE_TYPE_ENUM.HEART_RATE,
			]),
			this.foodRepo.getLoggedMealsByDate(userId, dateStr),
			this.chatRepo.getSummariesForUserLastDays(userId, 30),
			this.chatRepo.getChatMemoriesForUserLastDays(userId, 30),
		]);

		const filteredMessage = this.filterNoise(trimmed);
		const wordCountFiltered = this.wordCount(filteredMessage);
		const shouldCheckEmotional =
			wordCountFiltered >= this.MIN_WORDS_FOR_EMOTIONAL_CHECK &&
			this.hasEmotionalKeyword(trimmed);

		let emotionalStateForPayload: AIChatPayload["emotional_state"] | null =
			await this.chatRepo.getEmotionalStateIfFresh(
				userId,
				this.EMOTIONAL_STATE_COOLDOWN_MS,
			);

		if (shouldCheckEmotional && !emotionalStateForPayload) {
			try {
				const lastFive = chatHistory.slice(-5);
				const conversation: EmotionalStatePayload["conversation"] = [
					...lastFive.map((m) => ({
						role: m.role as CHAT_ROLES,
						content: m.message,
					})),
					{ role: CHAT_ROLES.USER, content: trimmed },
				];
				const response = await aiService.getEmotionalState({
					conversation,
				});
				const data = response.data;
				await this.chatRepo.upsertEmotionalState(userId, {
					mood: data.mood,
					motivation_level: data.motivation_level,
					stress_signals: data.stress_signals ?? [],
					confidence: data.confidence,
				});
				emotionalStateForPayload = {
					mood: data.mood,
					motivation_level: data.motivation_level,
					stress_signals: data.stress_signals ?? [],
					confidence: data.confidence,
				};
			} catch (error) {
				console.log("The error is", error);
				emotionalStateForPayload = null;
			}
		}

		const name =
			customerData?.firstName && customerData?.lastName
				? `${customerData.firstName} ${customerData.lastName}`.trim()
				: "User";
		const birthday = DateManager.formatDate(customerData.birthday);

		const diagnosisDate = DateManager.formatDate(customerData.birthday);

		const user_info: AIChatPayload["user_info"] = {
			name,
			gender: customerData.gender,
			birthday,
			diagnosisDate,
			weight: customerData.weight,
			height: customerData.height,
			diabetesType: this.DIABETES_TYPE_LABELS[customerData.diabetesType],
		};

		const blood_sugar = this.toRecordedValue(metricsResult.bloodSugarRecords);
		const steps = this.toRecordedValue(metricsResult.stepsRecords);
		const water_intake = this.toRecordedValue(metricsResult.waterIntakeRecords);
		const heart_rate = this.toRecordedValue(metricsResult.heartBeatRecords);
		const mealsPayload = meals.map(this.mealToPayload);

		const current_section_messages: AIChatPayload["current_section_messages"] =
			[
				...chatHistory.map((m) => ({
					role: m.role as ChatRole,
					content: m.message,
				})),
				{ role: CHAT_ROLES.USER, content: trimmed },
			];

		const behavior_patterns = await this.buildBehaviorPatterns(userId, dateStr);

		const payload: AIChatPayload = {
			user_info,
			health_summary: {
				last_24_hours: {
					blood_sugar,
					steps,
					water_intake,
					heart_rate,
					meals: mealsPayload,
				},
				last_days_health_summary: lastDaysSummaries,
			},
			current_section_messages,
			old_chat_memory: oldChatMemory,
			current_message: trimmed,
			behavior_patterns,
			emotional_state: emotionalStateForPayload || undefined,
		};

		const response = await aiService.chat(payload);
		const data = response.data;
		const assistantText = data.reply || "";
		if (!assistantText) {
			throw new Error("No reply from Diabot");
		}

		const recordedAtDate = new Date(recordedAt);
		await this.chatRepo.insertTransaction([
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.USER,
				message: trimmed,
				recordedAt: recordedAtDate,
			},
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.ASSISTANT,
				message: assistantText,
				recordedAt: recordedAtDate,
			},
		]);

		return { assistantMessage: assistantText };
	}
}
