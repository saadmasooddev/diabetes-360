import { pgTable, varchar, date, timestamp, uniqueIndex, numeric, integer, foreignKey, text, unique, boolean, uuid, jsonb, index, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const activityTypeEnum = pgEnum("activity_type_enum", ['cardio', 'strength_training', 'stretching'])
export const bloodSugarReadingTypeEnum = pgEnum("blood_sugar_reading_type_enum", ['normal', 'fasting', 'random', 'hba1c'])
export const bookingStatusEnum = pgEnum("booking_status_enum", ['pending', 'confirmed', 'cancelled', 'completed'])
export const chatRoleEnum = pgEnum("chat_role_enum", ['assistant', 'user'])
export const healthMetricReadingSourceEnum = pgEnum("health_metric_reading_source_enum", ['mobile', 'cgm', 'watch', 'custom'])
export const locationStatus = pgEnum("location_status", ['active', 'inactive'])
export const mealTypeEnum = pgEnum("meal_type_enum", ['Breakfast', 'Lunch', 'Dinner'])
export const metricTypeEnum = pgEnum("metric_type_enum", ['blood_glucose', 'steps', 'water_intake', 'heart_rate'])
export const paymentType = pgEnum("payment_type", ['monthly', 'annual', 'free'])
export const providerEnum = pgEnum("provider_enum", ['manual', 'google', 'apple', 'facebook'])
export const role = pgEnum("role", ['customer', 'admin', 'physician'])
export const slotTypeEnum = pgEnum("slot_type_enum", ['online', 'offline', 'onsite'])
export const summaryStatusEnum = pgEnum("summary_status_enum", ['save_as_draft', 'SIGNED'])


export const dailyMealPlans = pgTable("daily_meal_plans", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	planDate: date("plan_date").default(sql`CURRENT_DATE`).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const healthMetrics = pgTable("health_metrics", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	bloodSugar: numeric("blood_sugar"),
	waterIntake: numeric("water_intake"),
	heartRate: integer("heart_rate"),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	bloodSugarReadingType: bloodSugarReadingTypeEnum("blood_sugar_reading_type").default('normal').notNull(),
	readingSource: healthMetricReadingSourceEnum("reading_source").default('custom').notNull(),
}, (table) => [
	uniqueIndex("idx_health_metrics_recorded_at_reading_source").using("btree", table.recordedAt.asc().nullsLast().op("timestamptz_ops"), table.readingSource.asc().nullsLast().op("timestamptz_ops")),
]);

export const foodScanLimits = pgTable("food_scan_limits", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	freeUserLimit: integer("free_user_limit").default(5).notNull(),
	paidUserLimit: integer("paid_user_limit").default(20).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const healthMetricTargets = pgTable("health_metric_targets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id"),
	metricType: metricTypeEnum("metric_type").notNull(),
	targetValue: numeric("target_value").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "health_metric_targets_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const freeTierLimits = pgTable("free_tier_limits", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	glucoseLimit: integer("glucose_limit").default(2).notNull(),
	stepsLimit: integer("steps_limit").default(2).notNull(),
	waterLimit: integer("water_limit").default(2).notNull(),
	discountedConsultationQuota: integer("discounted_consultation_quota"),
	freeConsultationQuota: integer("free_consultation_quota"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const dailyNutrientRecommendations = pgTable("daily_nutrient_recommendations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	recommendationDate: date("recommendation_date").default(sql`CURRENT_DATE`).notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).notNull(),
	sugars: numeric({ precision: 10, scale:  2 }).notNull(),
	fibres: numeric({ precision: 10, scale:  2 }).notNull(),
	proteins: numeric({ precision: 10, scale:  2 }).notNull(),
	fats: numeric({ precision: 10, scale:  2 }).notNull(),
	calories: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const dailyPersonalizedInsights = pgTable("daily_personalized_insights", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	insightDate: date("insight_date").default(sql`CURRENT_DATE`).notNull(),
	insightText: text("insight_text").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const foodScanLogs = pgTable("food_scan_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	scanDate: date("scan_date").default(sql`CURRENT_DATE`).notNull(),
	scanCount: integer("scan_count").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "food_scan_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const customerData = pgTable("customer_data", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	gender: text().notNull(),
	birthday: timestamp({ mode: 'string' }).notNull(),
	weight: text().notNull(),
	height: text().notNull(),
	diabetesType: text("diabetes_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	mainGoal: text("main_goal"),
	medicationInfo: text("medication_info"),
}, (table) => [
	unique("customer_data_user_id_unique").on(table.userId),
]);

export const physicianSpecialties = pgTable("physician_specialties", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	icon: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("physician_specialties_name_unique").on(table.name),
]);

export const physicianRatings = pgTable("physician_ratings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id").notNull(),
	physicianId: varchar("physician_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [users.id],
			name: "physician_ratings_customer_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.physicianId],
			foreignColumns: [users.id],
			name: "physician_ratings_physician_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const physicianLocations = pgTable("physician_locations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	physicianId: varchar("physician_id").notNull(),
	locationName: text("location_name").notNull(),
	address: text(),
	city: text(),
	state: text(),
	country: text(),
	postalCode: text("postal_code"),
	latitude: numeric({ precision: 10, scale:  7 }).notNull(),
	longitude: numeric({ precision: 10, scale:  7 }).notNull(),
	status: locationStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	used: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	tokenId: uuid("token_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("refresh_tokens_token_id_unique").on(table.tokenId),
]);

export const healthInsights = pgTable("health_insights", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	insights: jsonb().notNull(),
	overallHealthSummary: text("overall_health_summary").notNull(),
	whatToDoNext: jsonb("what_to_do_next").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	password: text(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false),
	provider: providerEnum().default('manual').notNull(),
	providerId: text("provider_id"),
	role: role().default('customer').notNull(),
	paymentType: paymentType("payment_type").default('free').notNull(),
	isActive: boolean("is_active").default(true),
	profileComplete: boolean("profile_complete").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const exerciseLogs = pgTable("exercise_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	calories: integer().notNull(),
	activityType: activityTypeEnum("activity_type").notNull(),
	pace: varchar(),
	sets: varchar(),
	weight: varchar(),
	steps: varchar(),
	muscle: varchar(),
	duration: integer(),
	repitition: varchar(),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	exerciseName: varchar("exercise_name", { length: 200 }).notNull(),
	exerciseType: varchar("exercise_type", { length: 200 }),
	readingSource: healthMetricReadingSourceEnum("reading_source").default('custom').notNull(),
}, (table) => [
	uniqueIndex("idx_exercise_logs_recorded_at_reading_source").using("btree", table.recordedAt.asc().nullsLast().op("timestamptz_ops"), table.readingSource.asc().nullsLast().op("timestamptz_ops")),
]);

export const mealPlanMeals = pgTable("meal_plan_meals", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	mealPlanId: varchar("meal_plan_id").notNull(),
	mealType: mealTypeEnum("meal_type").notNull(),
	name: text().notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).notNull(),
	proteins: numeric({ precision: 10, scale:  2 }).notNull(),
	calories: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.mealPlanId],
			foreignColumns: [dailyMealPlans.id],
			name: "meal_plan_meals_meal_plan_id_daily_meal_plans_id_fk"
		}).onDelete("cascade"),
]);

export const slotSize = pgTable("slot_size", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	size: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("slot_size_size_unique").on(table.size),
]);

export const slots = pgTable("slots", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	availabilityId: varchar("availability_id").notNull(),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	slotSizeId: varchar("slot_size_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isCustom: boolean("is_custom").default(false).notNull(),
}, (table) => [
	index("idx_slots_availability_id").using("btree", table.availabilityId.asc().nullsLast().op("text_ops")),
	index("idx_slots_is_custom").using("btree", table.isCustom.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.availabilityId],
			foreignColumns: [availabilityDate.id],
			name: "slots_availability_id_availability_date_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.slotSizeId],
			foreignColumns: [slotSize.id],
			name: "slots_slot_size_id_slot_size_id_fk"
		}).onDelete("restrict"),
	unique("idx_slots_availability_id_start_time_end_time").on(table.availabilityId, table.startTime, table.endTime),
]);

export const medications = pgTable("medications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	consultationId: varchar("consultation_id").notNull(),
	physicianId: varchar("physician_id").notNull(),
	prescriptionDate: timestamp("prescription_date", { withTimezone: true, mode: 'string' }).notNull(),
	medicines: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.consultationId],
			foreignColumns: [bookedSlots.id],
			name: "medications_consultation_id_booked_slots_id_fk"
		}).onDelete("cascade"),
]);

export const recipes = pgTable("recipes", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	mealId: varchar("meal_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	ingredients: jsonb().default([]).notNull(),
	makingSteps: jsonb("making_steps").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.mealId],
			foreignColumns: [mealPlanMeals.id],
			name: "recipes_meal_id_meal_plan_meals_id_fk"
		}).onDelete("cascade"),
]);

export const slotLocations = pgTable("slot_locations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	slotId: varchar("slot_id").notNull(),
	locationId: varchar("location_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [physicianLocations.id],
			name: "slot_locations_location_id_physician_locations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.slotId],
			foreignColumns: [slots.id],
			name: "slot_locations_slot_id_slots_id_fk"
		}).onDelete("cascade"),
]);

export const slotPrice = pgTable("slot_price", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	slotId: varchar("slot_id").notNull(),
	slotTypeId: varchar("slot_type_id").notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.slotId],
			foreignColumns: [slots.id],
			name: "slot_price_slot_id_slots_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.slotTypeId],
			foreignColumns: [slotType.id],
			name: "slot_price_slot_type_id_slot_type_id_fk"
		}).onDelete("restrict"),
]);

export const slotType = pgTable("slot_type", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	type: slotTypeEnum().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("slot_type_type_unique").on(table.type),
]);

export const foodScanNutrients = pgTable("food_scan_nutrients", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	scanDate: date("scan_date").default(sql`CURRENT_DATE`).notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	sugars: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	fibres: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	proteins: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	fats: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	calories: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "food_scan_nutrients_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const availabilityDate = pgTable("availability_date", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	physicianId: varchar("physician_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_availability_date_date").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("idx_availability_date_physician_date").using("btree", table.physicianId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.physicianId],
			foreignColumns: [users.id],
			name: "availability_date_physician_id_users_id_fk"
		}).onDelete("cascade"),
	unique("availability_date_physician_id_date_unique").on(table.physicianId, table.date),
]);

export const labReports = pgTable("lab_reports", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	fileName: text("file_name").notNull(),
	filePath: text("file_path").notNull(),
	fileSize: text("file_size").notNull(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reportName: text("report_name"),
	reportType: varchar("report_type"),
	dateOfReport: date("date_of_report"),
});

export const userConsultationQuotas = pgTable("user_consultation_quotas", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	discountedConsultationsUsed: integer("discounted_consultations_used").default(0).notNull(),
	freeConsultationsUsed: integer("free_consultations_used").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_consultation_quotas_user_id_unique").on(table.userId),
]);

export const physicianData = pgTable("physician_data", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	specialtyId: varchar("specialty_id").notNull(),
	practiceStartDate: timestamp("practice_start_date", { mode: 'string' }).notNull(),
	consultationFee: numeric("consultation_fee", { precision: 10, scale:  2 }).notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.specialtyId],
			foreignColumns: [physicianSpecialties.id],
			name: "physician_data_specialty_id_physician_specialties_id_fk"
		}).onDelete("restrict"),
	unique("physician_data_user_id_unique").on(table.userId),
]);

export const twoFactorAuth = pgTable("two_factor_auth", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	secret: text().notNull(),
	backupCodes: text("backup_codes"),
	enabled: boolean().default(false).notNull(),
	verified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "two_factor_auth_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("two_factor_auth_user_id_unique").on(table.userId),
]);

export const loggedMeals = pgTable("logged_meals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	mealDate: date("meal_date").default(sql`CURRENT_DATE`).notNull(),
	foodName: text("food_name").notNull(),
	carbs: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	sugars: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	fibres: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	proteins: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	fats: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	calories: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	timeZoneId: uuid("time_zone_id"),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("logged_meals_user_id_meal_date_idx").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.mealDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.timeZoneId],
			foreignColumns: [timeZones.id],
			name: "logged_meals_time_zone_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "logged_meals_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const bookedSlots = pgTable("booked_slots", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id").notNull(),
	slotId: varchar("slot_id").notNull(),
	slotTypeId: varchar("slot_type_id").notNull(),
	status: bookingStatusEnum().default('pending').notNull(),
	summary: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	meetingLink: text("meeting_link"),
	summaryStatus: summaryStatusEnum("summary_status").default('save_as_draft').notNull(),
}, (table) => [
	index("idx_booked_slots_customer_id").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("idx_booked_slots_customer_status").using("btree", table.customerId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_booked_slots_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.slotId],
			foreignColumns: [slots.id],
			name: "booked_slots_slot_id_slots_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.slotTypeId],
			foreignColumns: [slotType.id],
			name: "booked_slots_slot_type_id_slot_type_id_fk"
		}).onDelete("restrict"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	chatDate: date("chat_date").notNull(),
	userId: varchar("user_id").notNull(),
	role: chatRoleEnum().default('user').notNull(),
	message: text().notNull(),
}, (table) => [
	index("chat_messages_recorded_at_idx").using("btree", table.recordedAt.asc().nullsLast().op("timestamptz_ops")),
	index("chat_messages_user_id_chat_date_idx").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.chatDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_messages_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const dailyHealthSummaries = pgTable("daily_health_summaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	summaryDate: date("summary_date").notNull(),
	summary: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("daily_health_summaries_summary_date_idx").using("btree", table.summaryDate.asc().nullsLast().op("date_ops")),
	uniqueIndex("idx_daily_health_summaries_user_date").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.summaryDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_health_summaries_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const chatMemories = pgTable("chat_memories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	memoriesDate: date("memories_date").notNull(),
	memories: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_memories_memories_date_idx").using("btree", table.memoriesDate.asc().nullsLast().op("date_ops")),
	uniqueIndex("idx_chat_memories_user_date").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.memoriesDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_memories_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const hba1CMetrics = pgTable("hba1c_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	hba1C: numeric().notNull(),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "hba1c_metrics_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userEmotionalState = pgTable("user_emotional_state", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	mood: varchar().notNull(),
	motivationLevel: varchar("motivation_level").notNull(),
	stressSignals: jsonb("stress_signals").notNull(),
	confidence: varchar().notNull(),
	storedAt: timestamp("stored_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_emotional_state_stored_at_idx").using("btree", table.storedAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_emotional_state_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_emotional_state_user_id_key").on(table.userId),
]);

export const timeZones = pgTable("time_zones", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("time_zones_name_key").on(table.name),
]);

export const dailyQuickLogs = pgTable("daily_quick_logs", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	exercise: varchar(),
	diet: varchar(),
	sleepDuration: varchar("sleep_duration"),
	medicines: varchar(),
	stressLevel: varchar("stress_level"),
	recordedAt: timestamp("recorded_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	logDate: date("log_date").notNull(),
}, (table) => [
	uniqueIndex("idx_daily_quick_logs_user_log_date").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.logDate.asc().nullsLast().op("text_ops")),
	index("idx_daily_quick_logs_user_recorded").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.recordedAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_quick_logs_user_id_fkey"
		}).onDelete("cascade"),
]);

export const slotTypeJunction = pgTable("slot_type_junction", {
	slotId: varchar("slot_id").notNull(),
	slotTypeId: varchar("slot_type_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.slotId],
			foreignColumns: [slots.id],
			name: "slot_type_junction_slot_id_slots_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.slotTypeId],
			foreignColumns: [slotType.id],
			name: "slot_type_junction_slot_type_id_slot_type_id_fk"
		}).onDelete("restrict"),
	primaryKey({ columns: [table.slotId, table.slotTypeId], name: "slot_type_junction_slot_id_slot_type_id_pk"}),
]);
