import { db } from "../../../app/config/db";
import { chatMessages } from "../models/chat.schema";
import { eq, and, sql, asc } from "drizzle-orm";
import type { ChatMessage, InsertChatMessage } from "../models/chat.schema";

export class ChatRepository {
	/**
	 * Get all chat messages for a user on a given date, ordered by recorded_at ascending.
	 * Uses DATE cast for consistent results.
	 */
	async getByUserAndDate(
		userId: string,
		dateStr: string,
	): Promise<ChatMessage[]> {
		return db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.userId, userId),
					sql`DATE(${chatMessages.chatDate}) = DATE(${dateStr})`,
				),
			)
			.orderBy(asc(chatMessages.recordedAt));
	}

	/**
	 * Insert a single chat message.
	 */
	async insertTransaction(data: InsertChatMessage[]): Promise<ChatMessage[]> {
		if (!data.length) return [];
		const dateStr = data[0].chatDate;
		const rows = await db
			.insert(chatMessages)
			.values(
				data.map((d) => ({
					userId: d.userId,
					chatDate: dateStr,
					role: d.role,
					message: d.message,
				})),
			)
			.returning();
		if (!rows) throw new Error("Failed to insert chat message");
		return rows;
	}
}
