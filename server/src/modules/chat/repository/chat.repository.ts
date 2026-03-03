import { db, dbUtils } from "../../../app/config/db";
import {
	CHAT_ROLES,
	chatMessages,
	dailyHealthSummaries,
	chatMemories,
	userEmotionalState,
} from "../models/chat.schema";
import { eq, and, sql, asc, desc, gte } from "drizzle-orm";
import type {
	ChatMessage,
	InsertChatMessage,
	DailyHealthSummary,
	InsertDailyHealthSummary,
} from "../models/chat.schema";

export class ChatRepository {
	/**
	 * Get all chat messages for a user on a given date, ordered by recorded_at ascending.
	 * Uses DATE cast for consistent results.
	 */
	async getByUser(
		userId: string,
		dateStr: string,
		offset?: number,
		limit?: number,
		filterByDate = true
	): Promise<{ totalMessages: number, messages: ChatMessage[]}> {
		const conditions = [
			eq(chatMessages.userId, userId),
		]
		if(filterByDate){
			conditions.push(
				sql`DATE(${chatMessages.chatDate}) = DATE(${dateStr})`,
			)
		}

		const totalMessagesPromise = db.select({ count: sql<number>`count(*)`})
		.from(chatMessages)
		.where(and(...conditions))

		const messagesPromise = db
			.select()
			.from(chatMessages)
			.where(
				and(
					...conditions
				),
			)
			.orderBy(desc(chatMessages.recordedAt))
			if(offset){
				messagesPromise.offset(offset)
			}
			if(limit){
				messagesPromise.limit(limit)
			}


			const [totalMessages, messages]= await Promise.all([totalMessagesPromise, messagesPromise])

			return {
				totalMessages: totalMessages[0].count || 0,
				messages: messages.reverse()
			}

	}

	/**
	 * Insert a single chat message.
	 */
	async insertTransaction(data: InsertChatMessage[]): Promise<ChatMessage[]> {
		if (!data.length) return [];
		const dateStr = data[0].chatDate;
		const rows = await dbUtils.transaction(async (tx) => {
			return await tx
				.insert(chatMessages)
				.values(
					data.map((d) => ({
						userId: d.userId,
						chatDate: dateStr,
						role: d.role,
						message: d.message,
						recordedAt: d.recordedAt,
					})),
				)
				.returning();
		});
		if (!rows) throw new Error("Failed to insert chat message");
		return rows;
	}

	async hasChatForDate(userId: string, dateStr: string): Promise<boolean> {
		const rows = await db
			.select({ id: chatMessages.id })
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.userId, userId),
					sql`DATE(${chatMessages.chatDate}) = DATE(${dateStr})`,
				),
			)
			.limit(1);
		return rows.length > 0;
	}

	async getSummaryByUserAndDate(
		userId: string,
		dateStr: string,
	): Promise<DailyHealthSummary | null> {
		const rows = await db
			.select()
			.from(dailyHealthSummaries)
			.where(
				and(
					eq(dailyHealthSummaries.userId, userId),
					sql`DATE(${dailyHealthSummaries.summaryDate}) = DATE(${dateStr})`,
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async getSummariesForUserLastDays(
		userId: string,
		days: number = 30,
	): Promise<Array<{ date: string; summary: string }>> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		const startStr = startDate.toISOString().split("T")[0];

		const rows = await db
			.select({
				date: dailyHealthSummaries.summaryDate,
				summary: dailyHealthSummaries.summary,
			})
			.from(dailyHealthSummaries)
			.where(
				and(
					eq(dailyHealthSummaries.userId, userId),
					sql`DATE(${dailyHealthSummaries.summaryDate}) >= DATE(${startStr})`,
				),
			)
			.orderBy(desc(dailyHealthSummaries.summaryDate))
			.limit(days);

		return rows.map((r) => ({
			date: r.date,
			summary: r.summary,
		}));
	}

	async insertDailySummary(
		data: InsertDailyHealthSummary,
	): Promise<DailyHealthSummary> {
		const [row] = await db
			.insert(dailyHealthSummaries)
			.values({
				userId: data.userId,
				summaryDate: data.summaryDate,
				summary: data.summary,
			})
			.onConflictDoNothing()
			.returning();
		if (!row) throw new Error("Failed to insert daily health summary");
		return row;
	}

	async getUserWhoDidChatWithAI(): Promise<{ userId: string }[]> {
		return db
			.selectDistinct({ userId: chatMessages.userId })
			.from(chatMessages)
			.where(eq(chatMessages.role, CHAT_ROLES.USER));
	}

	async getDistinctUserIdsWithChatOnDate(
		dateStr: string,
	): Promise<{ userId: string }[]> {
		return db
			.selectDistinct({ userId: chatMessages.userId })
			.from(chatMessages)
			.where(sql`DATE(${chatMessages.chatDate}) = DATE(${dateStr})`);
	}

	async upsertChatMemories(
		userId: string,
		memoriesDate: string,
		memories: string[],
	): Promise<void> {
		await db
			.insert(chatMemories)
			.values({
				userId,
				memoriesDate,
				memories,
			})
			.onConflictDoUpdate({
				target: [chatMemories.userId, chatMemories.memoriesDate],
				set: { memories },
			});
	}

	async getChatMemoriesForUserLastDays(
		userId: string,
		days: number = 30,
	): Promise<Array<{ date: string; chat_memory: string }>> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		const startStr = startDate.toISOString().split("T")[0];

		const rows = await db
			.select({
				date: chatMemories.memoriesDate,
				memories: chatMemories.memories,
			})
			.from(chatMemories)
			.where(
				and(
					eq(chatMemories.userId, userId),
					sql`DATE(${chatMemories.memoriesDate}) >= DATE(${startStr})`,
				),
			)
			.orderBy(desc(chatMemories.memoriesDate))
			.limit(days);

		return rows.map((r) => {
			const arr = Array.isArray(r.memories) ? r.memories : [];
			const chat_memory = arr
				.filter((m): m is string => typeof m === "string")
				.join(". ");
			return { date: r.date, chat_memory: chat_memory || "" };
		});
	}

	async getEmotionalStateIfFresh(
		userId: string,
		maxAgeMs: number,
	): Promise<{
		mood: string;
		motivation_level: string;
		stress_signals: string[];
		confidence: string;
	} | null> {
		const since = new Date(Date.now() - maxAgeMs);
		const rows = await db
			.select({
				mood: userEmotionalState.mood,
				motivationLevel: userEmotionalState.motivationLevel,
				stressSignals: userEmotionalState.stressSignals,
				confidence: userEmotionalState.confidence,
			})
			.from(userEmotionalState)
			.where(
				and(
					eq(userEmotionalState.userId, userId),
					gte(userEmotionalState.storedAt, since),
				),
			)
			.limit(1);
		const row = rows[0];
		if (!row) return null;
		const signals = Array.isArray(row.stressSignals)
			? (row.stressSignals as string[]).filter(
					(s): s is string => typeof s === "string",
				)
			: [];
		return {
			mood: row.mood,
			motivation_level: row.motivationLevel,
			stress_signals: signals,
			confidence: row.confidence,
		};
	}

	/**
	 * Insert or update emotional state for user (upsert by userId).
	 */
	async upsertEmotionalState(
		userId: string,
		data: {
			mood: string;
			motivation_level: string;
			stress_signals: string[];
			confidence: string;
		},
	): Promise<void> {
		await db
			.insert(userEmotionalState)
			.values({
				userId,
				mood: data.mood,
				motivationLevel: data.motivation_level,
				stressSignals: data.stress_signals,
				confidence: data.confidence,
			})
			.onConflictDoUpdate({
				target: userEmotionalState.userId,
				set: {
					mood: data.mood,
					motivationLevel: data.motivation_level,
					stressSignals: data.stress_signals,
					confidence: data.confidence,
					storedAt: new Date(),
				},
			});
	}
}
