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
	private readonly MIN_WORDS_FOR_EMOTIONAL_CHECK = 8;
	private readonly NOISE_WORDS_REGEX = /\b(ok(ay)?|oka|k|hmm+|yes|no|yep|nope|yeah|nah|acha|theek|thanks?|thank\s*you|haan|ha|nahi|nai|theek\s*hai|bilkul|ji\s*haan|ji\s*nahi|sahi|accha|thik|thik\s*hai|han|na|ji|haanji|nahi\s*ji|cool|fine|good|great|alright|sure|right|got\s*it|understood|okie|kay)\b|[\u{1F44D}\u{1F642}\u{1F600}\u{1F601}\u{2705}\u{274C}]/giu;
	// TODO: Add regex for the happy neutral too
	private readonly SAD_KEYWORDS_REGEX = /\b(thak\w*|tired\w*|stress\w*|pareshan\w*|frustrat\w*|fed\s*up\w*|anxious\w*|overwhelm\w*|sad\w*|low\w*|depress\w*|exhaust\w*|burnout\w*|tension\w*|ghabrahat\w*|udaas\w*|bechain\w*|takat\s*nahi\w*|kamzor\w*|weak\w*|hopeless\w*|niraash\w*|dil\s*tut\w*|dukhi\w*|afsoos\w*|chinta\w*|worr?y\w*|nervous\w*|scared\w*|darr\w*|daraavna\w*|takleef\w*|pain\w*|dard\w*)\b/giu;

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
		this.SAD_KEYWORDS_REGEX.lastIndex = 0;
		return this.SAD_KEYWORDS_REGEX.test(message);
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

		const recordedAt =
			dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`;

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
				heart_rate: this.toSummaryMetricValues(
					metricsResult.heartBeatRecords,
				),
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

			const payload = await this.buildTodayDataForSummary(
				userId,
				dateStr,
			);
			const response = await aiService.getLastDaysHealthSummary(payload);
			const summary = response.data?.last_day_summary;
			if (!summary || typeof summary !== "string") {
				throw new Error("Summary is not a string")
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
				const messages = await this.chatRepo.getByUserAndDate(
					userId,
					dateStr,
				);
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
					throw new Error("Suggested memories is not an array")
				}
				const valid = suggestedMemories.filter(
					(m): m is string => typeof m === "string",
				);

				await this.chatRepo.upsertChatMemories(userId, dateStr, valid);
		}
	}

	async getChatByDate(userId: string, dateStr: string): Promise<ChatMessage[]> {
		return this.chatRepo.getByUserAndDate(userId, dateStr);
	}

	async sendMessage(
		userId: string,
		dateStr: string,
		message: string,
		recordedAt: string
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

			console.log("the emotion condition", shouldCheckEmotional ,emotionalStateForPayload, filteredMessage, wordCountFiltered)
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
				console.log("The error is", error)
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
			...(emotionalStateForPayload && {
				emotional_state: emotionalStateForPayload,
			}),
		};

		const response = await aiService.chat(payload);
		const data = response.data;
		const assistantText = data.reply || "";
		if (!assistantText) {
			throw new Error("No reply from Diabot");
		}

		const recordedAtDate = new Date(recordedAt)
		await this.chatRepo.insertTransaction([
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.USER,
				message: trimmed,
				recordedAt:recordedAtDate 
			},
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.ASSISTANT,
				message: assistantText,
				recordedAt:recordedAtDate 
			},
		]);

		return { assistantMessage: assistantText };
	}
}
