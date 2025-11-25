import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const freeTierLimits = pgTable("free_tier_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  glucoseLimit: integer("glucose_limit").notNull().default(2),
  stepsLimit: integer("steps_limit").notNull().default(2),
  waterLimit: integer("water_limit").notNull().default(2),
  discountedConsultationQuota: integer("discounted_consultation_quota"),
  freeConsultationQuota: integer("free_consultation_quota"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFreeTierLimitsSchema = createInsertSchema(freeTierLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
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

