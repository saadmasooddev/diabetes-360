import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

export const userConsultationQuotas = pgTable("user_consultation_quotas", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	discountedConsultationsUsed: integer("discounted_consultations_used")
		.notNull()
		.default(0),
	freeConsultationsUsed: integer("free_consultations_used")
		.notNull()
		.default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserConsultationQuotaSchema = createInsertSchema(
	userConsultationQuotas,
)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		discountedConsultationsUsed: z.number().int().min(0).default(0),
		freeConsultationsUsed: z.number().int().min(0).default(0),
	});

export const updateUserConsultationQuotaSchema =
	insertUserConsultationQuotaSchema.partial();

export type InsertUserConsultationQuota = z.infer<
	typeof insertUserConsultationQuotaSchema
>;
export type UpdateUserConsultationQuota = z.infer<
	typeof updateUserConsultationQuotaSchema
>;
export type UserConsultationQuota = typeof userConsultationQuotas.$inferSelect;
