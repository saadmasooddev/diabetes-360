import { sql } from "drizzle-orm";
import {
	pgTable,
	varchar,
	timestamp,
	integer,
	date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

export const freeTierLimits = pgTable("free_tier_limits", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	glucoseLimit: integer("glucose_limit").notNull(),
	stepsLimit: integer("steps_limit").notNull(),
	waterLimit: integer("water_limit").notNull(),
	discountedConsultationQuota: integer("discounted_consultation_quota"),
	freeConsultationQuota: integer("free_consultation_quota"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFreeTierLimitsSchema = createInsertSchema(freeTierLimits)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		glucoseLimit: z.number().int().min(0),
		stepsLimit: z.number().int().min(0),
		waterLimit: z.number().int().min(0),
		discountedConsultationQuota: z.number().int().min(0).optional(),
		freeConsultationQuota: z.number().int().min(0).optional(),
	});

export const updateFreeTierLimitsSchema = insertFreeTierLimitsSchema.partial();

export type InsertFreeTierLimits = z.infer<typeof insertFreeTierLimitsSchema>;
export type UpdateFreeTierLimits = z.infer<typeof updateFreeTierLimitsSchema>;
export type FreeTierLimits = typeof freeTierLimits.$inferSelect;
export type ExtendedLimits = Omit<
	FreeTierLimits,
	"id" | "createdAt" | "updatedAt"
> & { foodScanLimits?: { freeTier: number; paidTier: number } };

// Food Scan Limits Table - stores limits for free and paid users
export const foodScanLimits = pgTable("food_scan_limits", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	freeUserLimit: integer("free_user_limit").notNull().default(5),
	paidUserLimit: integer("paid_user_limit").notNull().default(20),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFoodScanLimitsSchema = createInsertSchema(foodScanLimits)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		freeUserLimit: z.number().int().min(0),
		paidUserLimit: z.number().int().min(0),
	});

export const updateFoodScanLimitsSchema = insertFoodScanLimitsSchema.partial();

export type InsertFoodScanLimits = z.infer<typeof insertFoodScanLimitsSchema>;
export type UpdateFoodScanLimits = z.infer<typeof updateFoodScanLimitsSchema>;
export type FoodScanLimits = typeof foodScanLimits.$inferSelect;

// Food Scan Logs Table - tracks daily scans per user (normalized to 3NF)
export const foodScanLogs = pgTable("food_scan_logs", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	scanDate: date("scan_date").notNull().default(sql`CURRENT_DATE`),
	scanCount: integer("scan_count").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFoodScanLogsSchema = createInsertSchema(foodScanLogs)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		userId: z.string(),
		scanDate: z.date(),
		scanCount: z.number().int().min(1),
	});

export type InsertFoodScanLogs = z.infer<typeof insertFoodScanLogsSchema>;
export type FoodScanLogs = typeof foodScanLogs.$inferSelect;
