import { IsPrimaryKey, sql } from "drizzle-orm";
import {
	pgTable,
	text,
	varchar,
	timestamp,
	numeric,
	integer,
	boolean,
	pgEnum,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

import { z } from "zod";

export const USER_ROLES = {
	CUSTOMER: "customer",
	ADMIN: "admin",
	PHYSICIAN: "physician",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PROVIDERS = {
	MANUAL: "manual",
	GOOGLE: "google",
	APPLE: "apple",
	FACEBOOK: "facebook",
} as const;

export const userRoleEnum = z.enum([
	USER_ROLES.CUSTOMER,
	USER_ROLES.ADMIN,
	USER_ROLES.PHYSICIAN,
]);
export const userRole = pgEnum("role", [
	USER_ROLES.CUSTOMER,
	USER_ROLES.ADMIN,
	USER_ROLES.PHYSICIAN,
]);
export const provider = pgEnum("provider_enum", [
	PROVIDERS.MANUAL,
	PROVIDERS.GOOGLE,
	PROVIDERS.APPLE,
	PROVIDERS.FACEBOOK,
]);
export const providerEnum = z.enum([
	PROVIDERS.MANUAL,
	PROVIDERS.GOOGLE,
	PROVIDERS.APPLE,
	PROVIDERS.FACEBOOK,
]);

export enum PAYMENT_TYPE {
	MONTHLY = "monthly",
	ANNUAL = "annual",
	FREE = "free",
}
export const paymentTypeZodSchema = z.enum(Object.values(PAYMENT_TYPE));
export const paymentType = pgEnum(
	"payment_type",
	Object.values(PAYMENT_TYPE) as [string, ...string[]],
);

export const users = pgTable("users", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	password: text("password"), // Made optional for OAuth providers
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false),
	provider: provider("provider").notNull().default(PROVIDERS.MANUAL), // manual, google, apple, facebook
	providerId: text("provider_id"), // External provider ID
	role: userRole("role").default(USER_ROLES.CUSTOMER).notNull(), // customer, admin, physician
	paymentType: paymentType("payment_type").default("free").notNull(), // 'monthly', 'annual', or 'free'
	isActive: boolean("is_active").default(true),
	profileComplete: boolean("profile_complete").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	tokenId: uuid("token_id").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	used: boolean("used").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
	firstName: true,
	lastName: true,
	password: true,
	email: true,
	provider: true,
	providerId: true,
	role: true,
	isActive: true,
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
	id: true,
	createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(
	passwordResetTokens,
).omit({
	id: true,
	createdAt: true,
});

// Physician Specialties Table
export const physicianSpecialties = pgTable("physician_specialties", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	name: text("name").notNull().unique(),
	description: text("description"),
	icon: text("icon"), // For frontend icon display
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Physician Data Table (separate from users for extensibility)
export const physicianData = pgTable("physician_data", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	specialtyId: varchar("specialty_id")
		.notNull()
		.references(() => physicianSpecialties.id, { onDelete: "restrict" }),
	practiceStartDate: timestamp("practice_start_date").notNull(),
	consultationFee: numeric("consultation_fee", {
		precision: 10,
		scale: 2,
	}).notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Physician Ratings Table
export const physicianRatings = pgTable("physician_ratings", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	customerId: varchar("customer_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	physicianId: varchar("physician_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	rating: integer("rating").notNull(), // 1-5 rating
	comment: text("comment"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schemas for validation
export const insertPhysicianSpecialtySchema = createInsertSchema(
	physicianSpecialties,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePhysicianSpecialtySchema = createInsertSchema(
	physicianSpecialties,
)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial();

export const insertPhysicianDataSchema = createInsertSchema(physicianData)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.refine(
		(data) => validatePracticeStartDate(data.practiceStartDate?.toString()),
		{
			message: "Practice start date cannot be in the future",
			path: ["practiceStartDate"],
		},
	);

export const validatePracticeStartDate = (
	practiceStartDate?: string | undefined,
) => {
	if (!practiceStartDate) return true;
	const practiceDate = new Date(practiceStartDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return practiceDate <= today;
};
export const updatePhysicianDataSchema = createInsertSchema(physicianData)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial()
	.refine(
		(data) => {
			return validatePracticeStartDate(
				data.practiceStartDate?.toString() || "",
			);
		},
		{
			message: "Practice start date cannot be in the future",
			path: ["practiceStartDate"],
		},
	);

export const insertPhysicianRatingSchema = createInsertSchema(physicianRatings)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		rating: z.number().min(1).max(5),
	});

// Customer Data Table
export enum DIABETES_TYPE {
	TYPE1 = "type1",
	TYPE2 = "type2",
	GESTATIONAL = "gestational",
	PREDIABETES = "prediabetes",
}

export const diabetesTypeEnum = z.enum([
	DIABETES_TYPE.TYPE1,
	DIABETES_TYPE.TYPE2,
	DIABETES_TYPE.GESTATIONAL,
	DIABETES_TYPE.PREDIABETES,
]);

export const diabetesTypePgEnum = pgEnum("diabetes_type_enum", [
	DIABETES_TYPE.TYPE1,
	DIABETES_TYPE.TYPE2,
	DIABETES_TYPE.GESTATIONAL,
	DIABETES_TYPE.PREDIABETES,
]);

export const customerData = pgTable("customer_data", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: varchar("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
		.unique(),
	gender: text("gender").notNull(), // 'male' or 'female'
	birthday: timestamp("birthday").notNull(), // Combined birthday field
	diagnosisDate: timestamp("diagnosis_date").notNull(), // Combined diagnosis date field
	weight: text("weight").notNull(), // Stored as string, e.g., "70"
	height: text("height").notNull(), // Stored as string, e.g., "175"
	diabetesType: diabetesTypePgEnum("diabetes_type").notNull(), // 'type1', 'type2', 'gestational', 'prediabetes'
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerDataSchema = createInsertSchema(customerData)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		birthday: z
			.string()
			.or(z.date())
			.transform((val) => {
				if (typeof val === "string") {
					return new Date(val);
				}
				return val;
			}),
		diagnosisDate: z
			.string()
			.or(z.date())
			.transform((val) => {
				if (typeof val === "string") {
					return new Date(val);
				}
				return val;
			}),
	})
	.superRefine((data, ctx) => {
		const weight = parseFloat(data.weight);
		if (isNaN(weight) || weight <= 0) {
			ctx.addIssue({
				code: "custom",
				message: "Weight must be a positive number",
				path: ["weight"],
			});
		}
		const maxWeight = 1000;
		if (weight > maxWeight) {
			ctx.addIssue({
				code: "custom",
				message: "Weight must be less than 1000kg",
				path: ["weight"],
			});
		}
		const height = parseFloat(data.height);
		if (isNaN(height) || height < 0) {
			ctx.addIssue({
				code: "custom",
				message: "Height must be a positive number",
				path: ["height"],
			});
		}
		const maxHeight = 250;
		if (height > maxHeight) {
			ctx.addIssue({
				code: "custom",
				message: "Height must be less than 250cm",
				path: ["height"],
			});
		}
	});

// Schema for admin creating customer data (dates optional, diabetesType required)
export const insertCustomerDataAdminSchema = createInsertSchema(customerData)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		birthday: z
			.string()
			.min(1, "Birthday is required")
			.transform((val) => new Date(val)),
		diagnosisDate: z
			.string()
			.min(1, "Diagnosis date is required")
			.transform((val) => new Date(val)),
		weight: z.string().min(1, "Weight is required"),
		height: z.string().min(1, "Height is required"),
		diabetesType: z.string().min(1, "Diabetes type is required"),
	});

export const updateCustomerDataSchema = createInsertSchema(customerData)
	.omit({
		id: true,
		userId: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial()
	.extend({
		birthday: z
			.string()
			.or(z.date())
			.optional()
			.transform((val) => {
				if (!val) return undefined;
				if (typeof val === "string") {
					return new Date(val);
				}
				return val;
			}),
		diagnosisDate: z
			.string()
			.or(z.date())
			.optional()
			.transform((val) => {
				if (!val) return undefined;
				if (typeof val === "string") {
					return new Date(val);
				}
				return val;
			}),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
	})
	.superRefine((data, ctx) => {});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<
	typeof insertPasswordResetTokenSchema
>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type PhysicianSpecialty = typeof physicianSpecialties.$inferSelect;
export type InsertPhysicianSpecialty = z.infer<
	typeof insertPhysicianSpecialtySchema
>;
export type UpdatePhysicianSpecialty = z.infer<
	typeof updatePhysicianSpecialtySchema
>;

export type PhysicianData = typeof physicianData.$inferSelect;
export type InsertPhysicianData = z.infer<typeof insertPhysicianDataSchema>;
export type UpdatePhysicianData = z.infer<typeof updatePhysicianDataSchema>;

export type PhysicianRating = typeof physicianRatings.$inferSelect;
export type InsertPhysicianRating = z.infer<typeof insertPhysicianRatingSchema>;

export type CustomerData = typeof customerData.$inferSelect;
export type InsertCustomerData = z.infer<typeof insertCustomerDataSchema>;
export type UpdateCustomerData = z.infer<typeof updateCustomerDataSchema>;

// Physician Locations Table
export const LOCATION_STATUS = {
	ACTIVE: "active",
	INACTIVE: "inactive",
} as const;

export const locationStatusEnum = z.enum([
	LOCATION_STATUS.ACTIVE,
	LOCATION_STATUS.INACTIVE,
]);
export const locationStatus = pgEnum("location_status", [
	LOCATION_STATUS.ACTIVE,
	LOCATION_STATUS.INACTIVE,
]);

export const physicianLocations = pgTable("physician_locations", {
	id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
	physicianId: varchar("physician_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	locationName: text("location_name").notNull(),
	address: text("address"), // Full address from Google Maps
	city: text("city"),
	state: text("state"),
	country: text("country"),
	postalCode: text("postal_code"),
	latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
	longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
	status: locationStatus("status").default(LOCATION_STATUS.ACTIVE).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPhysicianLocationSchema = createInsertSchema(
	physicianLocations,
)
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		latitude: z.string().transform((val) => val),
		longitude: z.string().transform((val) => val),
		status: z
			.enum([LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE])
			.default(LOCATION_STATUS.ACTIVE),
	});

export const updatePhysicianLocationSchema = createInsertSchema(
	physicianLocations,
)
	.omit({
		id: true,
		physicianId: true,
		createdAt: true,
		updatedAt: true,
	})
	.partial()
	.extend({
		latitude: z
			.string()
			.optional()
			.transform((val) => val || undefined),
		longitude: z
			.string()
			.optional()
			.transform((val) => val || undefined),
		status: z
			.enum([LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE])
			.optional(),
	});

export type PhysicianLocation = typeof physicianLocations.$inferSelect;
export type InsertPhysicianLocation = z.infer<
	typeof insertPhysicianLocationSchema
>;
export type UpdatePhysicianLocation = z.infer<
	typeof updatePhysicianLocationSchema
>;

export const PERMISSIONS = {
	// Profile permissions
	READ_OWN_PROFILE: "read:own_profile",
	UPDATE_OWN_PROFILE: "update:own_profile",

	// Health metrics permissions
	READ_OWN_HEALTH_METRICS: "read:own_health_metrics",
	CREATE_OWN_HEALTH_METRICS: "create:own_health_metrics",
	UPDATE_OWN_HEALTH_METRICS: "update:own_health_metrics",
	DELETE_OWN_HEALTH_METRICS: "delete:own_health_metrics",
	READ_ALL_HEALTH_METRICS: "read:all_health_metrics",
	CREATE_ALL_HEALTH_METRICS: "create:all_health_metrics",
	UPDATE_ALL_HEALTH_METRICS: "update:all_health_metrics",
	DELETE_ALL_HEALTH_METRICS: "delete:all_health_metrics",

	// Health targets permissions
	READ_HEALTH_TARGETS: "read:health_targets",
	WRITE_OWN_HEALTH_TARGETS: "write:own_health_targets",
	WRITE_HEALTH_TARGETS: "write:health_targets",

	// Food scanner permissions
	SCAN_FOOD: "scan:food",

	// Medical records permissions
	READ_OWN_MEDICAL_RECORDS: "read:own_medical_records",
	CREATE_OWN_MEDICAL_RECORDS: "create:own_medical_records",
	UPDATE_OWN_MEDICAL_RECORDS: "update:own_medical_records",
	DELETE_OWN_MEDICAL_RECORDS: "delete:own_medical_records",
	READ_ALL_MEDICAL_RECORDS: "read:all_medical_records",
	CREATE_ALL_MEDICAL_RECORDS: "create:all_medical_records",
	UPDATE_ALL_MEDICAL_RECORDS: "update:all_medical_records",
	DELETE_ALL_MEDICAL_RECORDS: "delete:all_medical_records",

	// Patient permissions (for physicians)
	READ_PATIENT_PROFILES: "read:patient_profiles",
	READ_PATIENT_HEALTH_METRICS: "read:patient_health_metrics",
	CREATE_PATIENT_HEALTH_METRICS: "create:patient_health_metrics",
	UPDATE_PATIENT_HEALTH_METRICS: "update:patient_health_metrics",
	READ_PATIENT_MEDICAL_RECORDS: "read:patient_medical_records",
	CREATE_PATIENT_MEDICAL_RECORDS: "create:patient_medical_records",
	READ_PATIENT_ALERTS: "read:patient_alerts",

	// Booking permissions
	READ_OWN_BOOKINGS: "read:own_bookings",
	CREATE_BOOKINGS: "create:bookings",
	CANCEL_OWN_BOOKINGS: "cancel:own_bookings",
	READ_ALL_BOOKINGS: "read:all_bookings",
	UPDATE_ALL_BOOKINGS: "update:all_bookings",

	// Consultation permissions
	READ_OWN_CONSULTATIONS: "read:own_consultations",
	READ_CONSULTATION_QUOTAS: "read:consultation_quotas",

	// Physician permissions
	READ_PHYSICIANS: "read:physicians",
	READ_OWN_APPOINTMENTS: "read:own_appointments",
	UPDATE_OWN_APPOINTMENTS: "update:own_appointments",
	MANAGE_OWN_SLOTS: "manage:own_slots",
	READ_ALL_APPOINTMENTS: "read:all_appointments",
	MANAGE_PHYSICIAN_SLOTS: "manage:physician_slots",
	MANAGE_AVAILABILITY: "manage:availability",
	MANAGE_LOCATIONS: "manage:locations",
	READ_ALL_PATIENTS: "read:all_patients",

	// User management permissions (for admins)
	READ_ALL_USERS: "read:all_users",
	CREATE_USERS: "create:users",
	UPDATE_USERS: "update:users",
	DELETE_USERS: "delete:users",

	// Settings permissions
	CREATE_SETTINGS: "create:settings",
	READ_SETTINGS: "read:settings",
	UPDATE_SETTINGS: "update:settings",
	DELETE_SETTINGS: "delete:settings",

	USE_DIABOT: "use:diabot",
	SUBSCRIBE_HEALTH_PLANS: "subscribe:health_plans",

	MANAGE_OWN_SETTINGS: "manage:own_settings",
	VIEW_RECIPE: "view:recipe",
} as const;

const obj = {
	settings: {
		actions: ["create", "revoke"],
		children: {
			limits: {
				actions: ["delete", "update"],
			},
		},
	},
	healthMetrics: {
		actions: ["scan", "follow"],
	},
} as const;

type IsPlainObject<T> = T extends object
	? T extends readonly any[]
		? false
		: true
	: false;

type DeepKeys<T> = T extends object
	? {
			[K in keyof T]-?: K extends "children"
				? DeepKeys<T[K]>
				: K extends string
					?
							| `${K}`
							| (IsPlainObject<T[K]> extends true
									? `${K}.${DeepKeys<T[K]>}`
									: never)
					: never;
		}[keyof T]
	: never;

type t = DeepKeys<typeof obj>;

type Permissions<T> = {
	[K in keyof T]: K extends "children"
		? Permissions<T[K]>
		: T[K] extends object
			? T[K] extends { actions: readonly string[] }
				? `${K & string}:${T[K]["actions"][number]}`
				: never
			: K extends string
				? `${K}`
				: never;
};
type P = Permissions<(typeof obj)["settings"]["children"]>;

type NewPermission<T, Prefix extends string = ""> = T extends object
	? {
			[K in keyof T]-?: K extends "children"
				? NewPermission<T[K], Prefix>
				: K extends string
					? T[K] extends { actions: readonly string[] }
						? `${Prefix}${K}:${T[K]["actions"][number]}`
						: IsPlainObject<T[K]> extends true
							? NewPermission<T[K], `${Prefix}${K}.`>
							: never
					: never;
		}[keyof T]
	: never;
