import { ChatRepository } from "../repository/chat.repository";
import { CustomerRepository } from "../../customer/repository/customer.repository";
import { HealthRepository } from "../../health/repository/health.repository";
import { FoodRepository } from "../../food/repository/food.repository";
import { aiService } from "../../../shared/services/ai.service";
import type { AIChatPayload } from "../../../shared/services/ai.service";
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

	async getChatByDate(userId: string, dateStr: string): Promise<ChatMessage[]> {
		return this.chatRepo.getByUserAndDate(userId, dateStr);
	}

	async sendMessage(
		userId: string,
		dateStr: string,
		message: string,
	): Promise<{ assistantMessage: string }> {
		const trimmed = message.trim();
		if (trimmed === "") {
			throw new Error("Message cannot be empty");
		}

		const [customerData, chatHistory, metricsResult, meals] = await Promise.all(
			[
				this.customerRepo.getCustomerDataByUserId(userId),
				this.chatRepo.getByUserAndDate(userId, dateStr),
				this.healthRepo.getFilteredMetrics(userId, dateStr, dateStr, [
					EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE,
					EXERCISE_TYPE_ENUM.STEPS,
					EXERCISE_TYPE_ENUM.WATER_INTAKE,
					EXERCISE_TYPE_ENUM.HEART_RATE,
				]),
				this.foodRepo.getLoggedMealsByDate(userId, dateStr),
			],
		);

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
				last_days_health_summary: [],
			},
			current_section_messages,
			old_chat_memory: [],
			current_message: trimmed,
		};

		const response = await aiService.chat(payload);
		const data = response.data;
		const assistantText = data.reply || "";
		if (!assistantText) {
			throw new Error("No reply from Diabot");
		}

		await this.chatRepo.insertTransaction([
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.USER,
				message: trimmed,
			},
			{
				userId,
				chatDate: dateStr,
				role: CHAT_ROLES.ASSISTANT,
				message: assistantText,
			},
		]);

		return { assistantMessage: assistantText };
	}
}
