import { sql } from "drizzle-orm";
import {
	pgTable,
	varchar,
	timestamp,
	date,
	text,
	pgEnum,
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
		recordedAt: true,
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
