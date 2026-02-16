import { sql } from "drizzle-orm";
import {
	pgTable,
	varchar,
	timestamp,
	date,
	text,
	pgEnum,
	uniqueIndex,
	uuid,
	jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

export enum CHAT_ROLES {
	ASSISTANT = "assistant",
	USER = "user",
}

export const chatRoleEnum = pgEnum(
	"chat_role_enum",
	Object.values(CHAT_ROLES) as [string, ...string[]],
);

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

export const chatMessages = pgTable("chat_messages", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	recordedAt: timestamp("recorded_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	chatDate: date("chat_date").notNull(),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	role: chatRoleEnum("role").notNull().default("user"),
	message: text("message").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages)
	.omit({
		id: true,
	})
	.extend({
		userId: z.string().min(1),
		chatDate: z.string().superRefine((data, ctx) => {
			const date = new Date(data);
			if (isNaN(date.getTime())) {
				ctx.addIssue({
					code: "custom",
					message: "Invalid date format",
					path: ["chatDate"],
				});
			}
		}),
		role: z.enum(Object.values(CHAT_ROLES)),
		message: z.string().min(1),
	});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

/** Daily health summary per user per date (one per day). Used for last_days_health_summary in chat payload. */
export const dailyHealthSummaries = pgTable(
	"daily_health_summaries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		summaryDate: date("summary_date").notNull(),
		summary: text("summary").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_daily_health_summaries_user_date").on(
			table.userId,
			table.summaryDate,
		),
	],
);

export const insertDailyHealthSummarySchema = createInsertSchema(
	dailyHealthSummaries,
).omit({
	id: true,
	createdAt: true,
});

export type DailyHealthSummary = typeof dailyHealthSummaries.$inferSelect;
export type InsertDailyHealthSummary = z.infer<
	typeof insertDailyHealthSummarySchema
>;

/** Chat memories per user per date (AI-extracted key points). One row per user per day; memories stored as JSONB array. */
export const chatMemories = pgTable(
	"chat_memories",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		memoriesDate: date("memories_date").notNull(),
		memories: jsonb("memories").$type<string[]>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_chat_memories_user_date").on(
			table.userId,
			table.memoriesDate,
		),
	],
);

export const insertChatMemoriesSchema = createInsertSchema(chatMemories).omit({
	id: true,
	createdAt: true,
});

export type ChatMemory = typeof chatMemories.$inferSelect;
export type InsertChatMemory = z.infer<typeof insertChatMemoriesSchema>;

export const userEmotionalState = pgTable("user_emotional_state", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	mood: varchar("mood").notNull(),
	motivationLevel: varchar("motivation_level").notNull(),
	stressSignals: jsonb("stress_signals").$type<string[]>().notNull(),
	confidence: varchar("confidence").notNull(),
	storedAt: timestamp("stored_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const emotionalStateSchema = z.object({
	mood: z.string(),
	motivation_level: z.string(),
	stress_signals: z.array(z.string()),
	confidence: z.string(),
});

export type UserEmotionalState = typeof userEmotionalState.$inferSelect;
export type InsertUserEmotionalState = typeof userEmotionalState.$inferInsert;
