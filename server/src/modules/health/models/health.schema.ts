import { sql } from "drizzle-orm";
import {
	pgTable,
	varchar,
	timestamp,
	numeric,
	integer,
	pgEnum,
	jsonb,
	text,
	uuid,
	date,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
	BLOOD_SUGAR_READING_TYPES_ENUM,
	BloodSugarReadingTypeEnumValues,
	bloodSugarReadingTypeSchema,
	users,
} from "../../auth/models/user.schema";

export const bloodSugarReadingTypeEnumPg = pgEnum(
	"blood_sugar_reading_type_enum",
	[...Object.values(BLOOD_SUGAR_READING_TYPES_ENUM)] as [string, ...string[]],
);

export enum HEALTH_METRIC_SOURCE_ENUM {
	MOBILE = "mobile",
	CGM = "cgm",
	WATCH = "watch",
	CUSTOM = "custom",
}
export const healthMetricReadingSourceEnum = z.enum(
	Object.values(HEALTH_METRIC_SOURCE_ENUM),
);
export const healthMetricReadingSourceEnumPg = pgEnum(
	"health_metric_reading_source_enum",
	[...(Object.values(HEALTH_METRIC_SOURCE_ENUM) as [string, ...string[]])],
);

export const healthMetrics = pgTable(
	"health_metrics",
	{
		id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		bloodSugar: numeric("blood_sugar"),
		bloodSugarReadingType: bloodSugarReadingTypeEnumPg(
			"blood_sugar_reading_type",
		)
			.notNull()
			.default(BLOOD_SUGAR_READING_TYPES_ENUM.NORMAL),
		heartRate: integer("heart_rate"),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		readingSource: healthMetricReadingSourceEnumPg("reading_source").default(
			HEALTH_METRIC_SOURCE_ENUM.CUSTOM,
		),
	},
	(table) => [
		uniqueIndex("idx_health_metrics_recorded_at_reading_source").on(
			table.recordedAt,
			table.readingSource,
		),
	],
);

export const insertHealthMetricSchema = createInsertSchema(healthMetrics)
	.omit({
		id: true,
	})
	.extend({
		userId: z.string().min(1),
		bloodSugar: z.number().nullable().optional(),
		bloodSugarReadingType: bloodSugarReadingTypeSchema.optional(),
		heartRate: z.number().int().nullable().optional(),
		recordedAt: z.string(),
		readingSource: healthMetricReadingSourceEnum.optional(),
	})
	.superRefine((data, ctx) => {
		if (
			data.bloodSugar &&
			data.bloodSugarReadingType !== BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C &&
			(data.bloodSugar < 1 || data.bloodSugar > 2700)
		) {
			ctx.addIssue({
				code: "custom",
				message: "Blood glucose value must be between 70-2700 mg/dL",
				path: ["bloodSugar"],
			});
		}

		if (
			data.bloodSugar &&
			data.bloodSugarReadingType === BLOOD_SUGAR_READING_TYPES_ENUM.HBA1C &&
			(data.bloodSugar < 0 || data.bloodSugar > 100)
		) {
			ctx.addIssue({
				code: "custom",
				message: "HbA1c value value must be between 0 and 100",
				path: ["bloodSugar"],
			});
		}

		if (data.heartRate && (data.heartRate < 0 || data.heartRate > 220)) {
			ctx.addIssue({
				code: "custom",
				message: "Heart rate value must be between 0-220 bpm",
				path: ["heartRate"],
			});
		}

		if (data.recordedAt && isNaN(new Date(data.recordedAt).getTime()))
			ctx.addIssue({
				code: "custom",
				message: "Invalid date format",
				path: ["recordedAt"],
			});
	});

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type MertricRecord = {
	id: string;
	userId: string;
	value: number | null;
	recordedAt: Date;
};

export type BloodSugarMetricRecord = MertricRecord & {
	readingType: BLOOD_SUGAR_READING_TYPES_ENUM;
};

export type ExtendedHealthMetric = HealthMetric & {
	steps?: number;
	fastingSugar?: string | null;
	randomSugar?: string | null;
	exerciseSets?: number;
	hba1c?: string | null;
};

export enum ACTIVITY_TYPE_ENUM {
	CARDIO = "cardio",
	STRENGTH_TRAINING = "strength_training",
	STRETCHING = "stretching",
}
export type ActivityType =
	(typeof ACTIVITY_TYPE_ENUM)[keyof typeof ACTIVITY_TYPE_ENUM];
export const activityTypeEnum = pgEnum(
	"activity_type_enum",
	Object.values(ACTIVITY_TYPE_ENUM) as [string, ...string[]],
);
export const activityTypeSchema = z.enum(Object.values(ACTIVITY_TYPE_ENUM));

export const exerciseLogs = pgTable(
	"exercise_logs",
	{
		id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		exerciseType: varchar("exercise_type"),
		exerciseName: varchar("exercise_name").notNull(),
		calories: integer("calories").notNull(),
		activityType: activityTypeEnum("activity_type").notNull(),
		pace: varchar("pace"),
		sets: varchar("sets"),
		weight: varchar("weight"),
		steps: varchar("steps"),
		muscle: varchar("muscle"),
		duration: integer("duration"),
		repitition: varchar("repitition"),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		readingSource: healthMetricReadingSourceEnumPg("reading_source").default(
			HEALTH_METRIC_SOURCE_ENUM.CUSTOM,
		),
	},
	(table) => [
		uniqueIndex("idx_exercise_logs_recorded_at_reading_source").on(
			table.recordedAt,
			table.readingSource,
		),
	],
);

export const insertExerciseLogSchema = createInsertSchema(exerciseLogs)
	.omit({
		id: true,
	})
	.extend({
		userId: z.string().min(1),
		exerciseType: z.string().optional(),
		exerciseName: z.string().min(1),
		calories: z.coerce.number().transform((v) => Math.round(v)),
		activityType: activityTypeSchema,
		pace: z.string().nullable().optional(),
		sets: z.string().nullable().optional(),
		weight: z.string().nullable().optional(),
		steps: z.coerce.number().int().nullable().optional(),
		muscle: z.string().nullable().optional(),
		duration: z.coerce
			.number()
			.min(1, { error: "Duration must be greater than 0" })
			.transform((v) => Math.round(v))
			.nullable()
			.optional(),
		repitition: z.string().nullable().optional(),
		recordedAt: z.string(),
		readingSource: healthMetricReadingSourceEnum.optional(),
	});

export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogs.$inferSelect;

// Health Metric Targets Table - for storing admin recommended values and user-specific targets
export enum METRIC_TYPE_ENUM {
	BLOOD_GLUCOSE = "blood_glucose",
	STEPS = "steps",
	HEART_RATE = "heart_rate",
	CALORIE_INTAKE = "calorie_intake",
}

export const metricTypes = Object.values(METRIC_TYPE_ENUM);
export type MetricType =
	(typeof METRIC_TYPE_ENUM)[keyof typeof METRIC_TYPE_ENUM];
export const metricTypeEnum = pgEnum(
	"metric_type_enum",
	metricTypes.filter((t) => t !== METRIC_TYPE_ENUM.CALORIE_INTAKE) as [
		string,
		...string[],
	],
);

export const healthMetricTargets = pgTable("health_metric_targets", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id").references(() => users.id, {
		onDelete: "cascade",
	}), // NULL for admin defaults, specific userId for user targets
	metricType: metricTypeEnum("metric_type").notNull(),
	targetValue: numeric("target_value").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Validation helper function for target values based on metric type
const validateTargetValue = (
	metricType: MetricType,
	value: number,
): boolean => {
	switch (metricType) {
		case METRIC_TYPE_ENUM.BLOOD_GLUCOSE:
			// Normal blood glucose: 70-100 mg/dL (fasting), 140-180 mg/dL (post-meal)
			// Target range: 70-200 mg/dL (reasonable range for diabetes management)
			return value >= 70 && value <= 200;
		case METRIC_TYPE_ENUM.STEPS:
			// Reasonable daily steps: 0-50,000 (very active person max)
			return value >= 0 && value <= 50000;
		case METRIC_TYPE_ENUM.HEART_RATE:
			// Normal resting: 60-100 bpm, max during exercise: ~220 - age
			// Target range: 40-200 bpm (covers all scenarios)
			return value >= 40 && value <= 200;
		default:
			return value >= 0;
	}
};

export const insertHealthMetricTargetSchema = createInsertSchema(
	healthMetricTargets,
)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		userId: z.string().nullable().optional(),
		metricType: z.enum(metricTypes),
		targetValue: z.number().min(0),
	})
	.superRefine((data, ctx) => {
		if (!validateTargetValue(data.metricType, data.targetValue)) {
			switch (data.metricType) {
				case METRIC_TYPE_ENUM.BLOOD_GLUCOSE:
					ctx.addIssue({
						code: "custom",
						message: "Blood glucose target must be between 70-200 mg/dL",
						path: ["targetValue"],
					});
					break;
				case METRIC_TYPE_ENUM.HEART_RATE:
					ctx.addIssue({
						code: "custom",
						message: "Heart rate target must be between 40-200 bpm",
						path: ["targetValue"],
					});
					break;
			}
		}
	});

export const updateHealthMetricTargetSchema = insertHealthMetricTargetSchema
	.partial()
	.extend({
		targetValue: z.number().min(0).optional(),
	});

export const batchUpsertHealthMetricTargetsSchema = z.object({
	targets: z.array(insertHealthMetricTargetSchema).min(1),
});

export type InsertHealthMetricTarget = z.infer<
	typeof insertHealthMetricTargetSchema
>;
export type HealthMetricTarget = typeof healthMetricTargets.$inferSelect;

// Health Insights Table - stores AI-generated health insights, tips, and summary
export const healthInsights = pgTable("health_insights", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	insights: jsonb("insights").notNull(), // Array of insight objects
	overallHealthSummary: text("overall_health_summary").notNull(),
	whatToDoNext: jsonb("what_to_do_next").notNull(), // Array of tip objects
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type HealthInsight = typeof healthInsights.$inferSelect;

export const hba1cMetrics = pgTable("hba1c_metrics", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	hba1c: numeric("hba1c").notNull(),
	recordedAt: timestamp("recorded_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Hba1cMetrics = typeof hba1cMetrics.$inferSelect;
export const insertHba1cMetricSchema = createInsertSchema(hba1cMetrics)
	.omit({
		id: true,
	})
	.extend({
		userId: z.string().min(1),
		hba1c: z.string().min(0),
		recordedAt: z.string(),
	})
	.superRefine((data, ctx) => {
		const hba1c = parseFloat(data.hba1c);
		if (isNaN(hba1c)) {
			ctx.addIssue({
				code: "custom",
				message: "HbA1c value must be a valid number",
				path: ["hba1c"],
			});
			return;
		}
		if (hba1c < 0 || hba1c > 100) {
			ctx.addIssue({
				code: "custom",
				message: "HbA1c value must be between 0-100",
				path: ["hba1c"],
			});
		}
	});
export type InsertHba1cMetric = z.infer<typeof insertHba1cMetricSchema>;

// Daily Quick Logs - Exercise, Diet, Sleep, Medicines, Stress

export enum QUICK_LOG_EXERCISE_TYPE_ENUM {
	NONE = "none",
	LIGHT = "light",
	MODERATE = "moderate",
	INTENSE = "intense",
}

export const quickLogExerciseTypeEnum = pgEnum(
	"quick_log_exercise_type_enum",
	Object.values(QUICK_LOG_EXERCISE_TYPE_ENUM) as [string, ...string[]],
);
export const quickLogExerciseTypeSchema = z.enum(
	Object.values(QUICK_LOG_EXERCISE_TYPE_ENUM),
);
export type QuickLogExerciseTypeEnumValues =
	(typeof QUICK_LOG_EXERCISE_TYPE_ENUM)[keyof typeof QUICK_LOG_EXERCISE_TYPE_ENUM];

export enum QUICK_LOG_DIET_TYPE_ENUM {
	MOSTLY_HOME_COOKED = "mostly_home_cooked",
	MIXED = "mixed",
	HIGH_CARB_OUTSIDE = "high_carb_outside",
}
export const quickLogDietTypeEnum = pgEnum(
	"quick_log_diet_type_enum",
	Object.values(QUICK_LOG_DIET_TYPE_ENUM) as [string, ...string[]],
);
export const quickLogDietTypeSchema = z.enum(
	Object.values(QUICK_LOG_DIET_TYPE_ENUM),
);
export type QuickLogDietTypeEnumValues =
	(typeof QUICK_LOG_DIET_TYPE_ENUM)[keyof typeof QUICK_LOG_DIET_TYPE_ENUM];

export enum QUICK_LOG_SLEEP_DURATION_TYPE_ENUM {
	LESS_5 = "less_5",
	FIVE_SEVEN = "5_7",
	MORE_7 = "more_7",
}
export const quickLogSleepDurationTypeEnum = pgEnum(
	"quick_log_sleep_duration_type_enum",
	Object.values(QUICK_LOG_SLEEP_DURATION_TYPE_ENUM) as [string, ...string[]],
);
export const quickLogSleepDurationTypeSchema = z.enum(
	Object.values(QUICK_LOG_SLEEP_DURATION_TYPE_ENUM),
);
export type QuickLogSleepDurationTypeEnumValues =
	(typeof QUICK_LOG_SLEEP_DURATION_TYPE_ENUM)[keyof typeof QUICK_LOG_SLEEP_DURATION_TYPE_ENUM];
export enum QUICK_LOG_MEDICINES_TYPE_ENUM {
	TAKEN = "taken",
	MISSED = "missed",
}
export const quickLogMedicinesTypeEnum = pgEnum(
	"quick_log_medicines_type_enum",
	Object.values(QUICK_LOG_MEDICINES_TYPE_ENUM) as [string, ...string[]],
);
export const quickLogMedicinesTypeSchema = z.enum(
	Object.values(QUICK_LOG_MEDICINES_TYPE_ENUM),
);
export type QuickLogMedicinesTypeEnumValues =
	(typeof QUICK_LOG_MEDICINES_TYPE_ENUM)[keyof typeof QUICK_LOG_MEDICINES_TYPE_ENUM];

export enum QUICK_LOG_STRESS_LEVEL_TYPE_ENUM {
	LOW = "low",
	MODERATE = "moderate",
	HIGH = "high",
}
export const quickLogStressLevelTypeEnum = pgEnum(
	"quick_log_stress_level_type_enum",
	Object.values(QUICK_LOG_STRESS_LEVEL_TYPE_ENUM) as [string, ...string[]],
);
export const quickLogStressLevelTypeSchema = z.enum(
	Object.values(QUICK_LOG_STRESS_LEVEL_TYPE_ENUM),
);
export type QuickLogStressLevelTypeEnumValues =
	(typeof QUICK_LOG_STRESS_LEVEL_TYPE_ENUM)[keyof typeof QUICK_LOG_STRESS_LEVEL_TYPE_ENUM];

export const dailyQuickLogs = pgTable(
	"daily_quick_logs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: varchar("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		logDate: date("log_date").notNull(),
		exercise: varchar("exercise"),
		diet: varchar("diet"),
		sleepDuration: varchar("sleep_duration"),
		medicines: varchar("medicines"),
		stressLevel: varchar("stress_level"),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_daily_quick_logs_user_log_date").on(
			table.userId,
			table.logDate,
		),
	],
);

export const insertDailyQuickLogSchema = createInsertSchema(dailyQuickLogs)
	.omit({ id: true })
	.extend({
		userId: z.string().min(1),
		logDate: z.string().optional(),
		exercise: quickLogExerciseTypeSchema.optional().nullable(),
		diet: quickLogDietTypeSchema.optional().nullable(),
		sleepDuration: quickLogSleepDurationTypeSchema.optional().nullable(),
		medicines: quickLogMedicinesTypeSchema.optional().nullable(),
		stressLevel: quickLogStressLevelTypeSchema.optional().nullable(),
		recordedAt: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (
			!data.exercise &&
			!data.diet &&
			!data.sleepDuration &&
			!data.medicines &&
			!data.stressLevel
		) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be filled",
				path: ["exercise", "diet", "sleepDuration", "medicines", "stressLevel"],
			});
		}
	});

export type InsertDailyQuickLog = z.infer<typeof insertDailyQuickLogSchema>;
export type DailyQuickLog = typeof dailyQuickLogs.$inferSelect;

export type HealthMetricReading = {
	value: number;
	recordedAt: string;
	readingSource: HEALTH_METRIC_SOURCE_ENUM;
};

export type HealthMetricData = {
	userId: string;
	bloodSugar: HealthMetricReading[];
	heartRate: HealthMetricReading[];
	waterIntake: HealthMetricReading[];
	bloodSugarReadingType: BloodSugarReadingTypeEnumValues;
};

export const healthMetricReadingSchema = z.object({
	value: z.number().min(0),
	recordedAt: z.string(),
	source: healthMetricReadingSourceEnum,
});

export const healthMetricDataSchema = z.object({
	userId: z.string().min(1),
	bloodSugar: z.array(z.object(healthMetricReadingSchema)),
	heartRate: z.array(z.object(healthMetricReadingSchema)),
	waterIntake: z.array(z.object(healthMetricReadingSchema)),
	bloodSugarReadingType: bloodSugarReadingTypeSchema,
});
