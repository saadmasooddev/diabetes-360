import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bloodSugar: numeric("blood_sugar"),
  steps: integer("steps"),
  waterIntake: numeric("water_intake"),
  heartRate: integer("heart_rate"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  recordedAt: true,
}).extend({
  userId: z.string().min(1),
  bloodSugar: z.string().nullable().optional(),
  waterIntake: z.string().nullable().optional(),
  steps: z.number().int().nullable().optional(),
  heartRate: z.number().int().nullable().optional(),
});

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type MertricRecord = { id: string, userId: string, value: number | string, recordedAt: Date };

