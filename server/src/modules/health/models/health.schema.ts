import { sql } from "drizzle-orm";
import { pgTable,  varchar, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
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
  bloodSugar: z.number().nullable().optional(),
  waterIntake: z.number().nullable().optional(),
  steps: z.number().int().nullable().optional(),
  heartRate: z.number().int().nullable().optional(),
});

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type MertricRecord = { id: string, userId: string, value: number | null, recordedAt: Date };

export const activityTypeEnum = pgEnum("activity_type", ["walking", "yoga"]);
// Activity Logs Table - for time-based activities (walking, yoga) stored in minutes
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: activityTypeEnum("activity_type").notNull(), // 'walking' or 'yoga'
  durationMinutes: integer("duration_minutes").notNull(), // Normalized to minutes
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  recordedAt: true,
}).extend({
  userId: z.string().min(1),
  activityType: z.enum(["walking", "yoga"]),
  durationMinutes: z.number().int().min(0),
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Exercise Logs Table - for count-based strength training exercises
export const exerciseTypeEnum = pgEnum("exercise_type", ["pushups", "squats", "chinups", "situps"]);

export const exerciseLogs = pgTable("exercise_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseType: exerciseTypeEnum("exercise_type").notNull(), // 'pushups', 'squats', 'chinups', 'situps'
  count: integer("count").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({
  id: true,
  recordedAt: true,
}).extend({
  userId: z.string().min(1),
  exerciseType: z.enum(["pushups", "squats", "chinups", "situps"]),
  count: z.number().int().min(0),
});

export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;

// Health Metric Targets Table - for storing admin recommended values and user-specific targets
export const metricTypeEnum = pgEnum("metric_type", ["glucose", "steps", "water_intake", "heart_rate"]);

export const healthMetricTargets = pgTable("health_metric_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // NULL for admin defaults, specific userId for user targets
  metricType: metricTypeEnum("metric_type").notNull(),
  targetValue: numeric("target_value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Validation helper function for target values based on metric type
const validateTargetValue = (metricType: string, value: number): boolean => {
  switch (metricType) {
    case "glucose":
      // Normal blood glucose: 70-100 mg/dL (fasting), 140-180 mg/dL (post-meal)
      // Target range: 70-200 mg/dL (reasonable range for diabetes management)
      return value >= 70 && value <= 200;
    case "steps":
      // Reasonable daily steps: 0-50,000 (very active person max)
      return value >= 0 && value <= 50000;
    case "water_intake":
      // Maximum 5L per day (recommended max is 3-4L, but 5L is absolute max)
      return value >= 0 && value <= 5;
    case "heart_rate":
      // Normal resting: 60-100 bpm, max during exercise: ~220 - age
      // Target range: 40-200 bpm (covers all scenarios)
      return value >= 40 && value <= 200;
    default:
      return value >= 0;
  }
};

export const insertHealthMetricTargetSchema = createInsertSchema(healthMetricTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().nullable().optional(),
  metricType: z.enum(["glucose", "steps", "water_intake", "heart_rate"]),
  targetValue: z.number().min(0),
}).superRefine((data, ctx) => {
  if (!validateTargetValue(data.metricType, data.targetValue)) {
    switch (data.metricType) {
      case "glucose":
        ctx.addIssue({
          code: "custom", 
          message: "Blood glucose target must be between 70-200 mg/dL",
          path: ["targetValue"],
        });
        break;
      case "steps":
        ctx.addIssue({
          code: "custom",
          message: "Steps target must be between 0-50,000 steps per day",
          path: ["targetValue"],
        });
        break;
      case "water_intake":
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Water intake target must be between 0-5 liters per day",
          path: ["targetValue"],
        });
        break;
      case "heart_rate":
        ctx.addIssue({
          code:  "custom",
          message: "Heart rate target must be between 40-200 bpm",
          path: ["targetValue"],
        });
        break;
    }
  }
})

export const updateHealthMetricTargetSchema = insertHealthMetricTargetSchema.partial().extend({
  targetValue: z.number().min(0).optional(),
});

export const batchUpsertHealthMetricTargetsSchema = z.object({
  targets: z.array(insertHealthMetricTargetSchema).min(1),
});

export type InsertHealthMetricTarget = z.infer<typeof insertHealthMetricTargetSchema>;
export type UpdateHealthMetricTarget = z.infer<typeof updateHealthMetricTargetSchema>;
export type HealthMetricTarget = typeof healthMetricTargets.$inferSelect;

