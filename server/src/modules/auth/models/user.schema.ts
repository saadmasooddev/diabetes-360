import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  PHYSICIAN: "physician",
} as const;

export const userRoleEnum = z.enum([USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.PHYSICIAN]);
export const userRole = pgEnum("role",[USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.PHYSICIAN]);

export const paymentTypeEnum = z.enum(['monthly', 'annual', 'free']);
export const paymentType = pgEnum("payment_type", ['monthly', 'annual', 'free']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password"), // Made optional for OAuth providers
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  provider: text("provider").notNull().default("manual"), // manual, google, apple, facebook
  providerId: text("provider_id"), // External provider ID
  role: userRole("role").default(USER_ROLES.CUSTOMER).notNull(), // customer, admin, physician
  paymentType: paymentType("payment_type").default('free').notNull(), // 'monthly', 'annual', or 'free'
  isActive: boolean("is_active").default(true),
  profileComplete: boolean("profile_complete").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revoked: boolean("revoked").default(false),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
})

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  specialtyId: varchar("specialty_id").notNull().references(() => physicianSpecialties.id, { onDelete: "restrict" }),
  practiceStartDate: timestamp("practice_start_date").notNull(),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Physician Ratings Table
export const physicianRatings = pgTable("physician_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  physicianId: varchar("physician_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 rating
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schemas for validation
export const insertPhysicianSpecialtySchema = createInsertSchema(physicianSpecialties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePhysicianSpecialtySchema = createInsertSchema(physicianSpecialties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertPhysicianDataSchema = createInsertSchema(physicianData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => validatePracticeStartDate(data.practiceStartDate?.toString()),
  {
    message: "Practice start date cannot be in the future",
    path: ["practiceStartDate"],
  }
);

export const validatePracticeStartDate = (practiceStartDate?: string | undefined) => {
  if (!practiceStartDate) return true;
  const practiceDate = new Date(practiceStartDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return practiceDate <= today;
};
export const updatePhysicianDataSchema = createInsertSchema(physicianData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial().refine(
  (data) => {
    return validatePracticeStartDate(data.practiceStartDate?.toString() || '');
  },
  {
    message: "Practice start date cannot be in the future",
    path: ["practiceStartDate"],
  }
);

export const insertPhysicianRatingSchema = createInsertSchema(physicianRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().min(1).max(5),
});

// Customer Data Table
export const customerData = pgTable("customer_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  gender: text("gender").notNull(), // 'male' or 'female'
  birthday: timestamp("birthday").notNull(), // Combined birthday field
  diagnosisDate: timestamp("diagnosis_date").notNull(), // Combined diagnosis date field
  weight: text("weight").notNull(), // Stored as string, e.g., "70"
  height: text("height").notNull(), // Stored as string, e.g., "175"
  diabetesType: text("diabetes_type").notNull(), // 'type1', 'type2', 'gestational', 'prediabetes'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerDataSchema = createInsertSchema(customerData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  birthday: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  diagnosisDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Schema for admin creating customer data (dates optional, diabetesType required)
export const insertCustomerDataAdminSchema = createInsertSchema(customerData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  birthday: z.string().min(1, "Birthday is required").transform((val) => new Date(val)),
  diagnosisDate: z.string().min(1, "Diagnosis date is required").transform((val) => new Date(val)),
  weight: z.string().min(1, "Weight is required"),
  height: z.string().min(1, "Height is required"),
  diabetesType: z.string().min(1, "Diabetes type is required"),
});

export const updateCustomerDataSchema = createInsertSchema(customerData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  birthday: z.string().or(z.date()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  diagnosisDate: z.string().or(z.date()).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type PhysicianSpecialty = typeof physicianSpecialties.$inferSelect;
export type InsertPhysicianSpecialty = z.infer<typeof insertPhysicianSpecialtySchema>;
export type UpdatePhysicianSpecialty = z.infer<typeof updatePhysicianSpecialtySchema>;

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

export const locationStatusEnum = z.enum([LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE]);
export const locationStatus = pgEnum("location_status", [LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE]);

export const physicianLocations = pgTable("physician_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  physicianId: varchar("physician_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationName: text("location_name").notNull(),
  address: text("address"), // Full address from Google Maps
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  status: locationStatus('status').default(LOCATION_STATUS.ACTIVE).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPhysicianLocationSchema = createInsertSchema(physicianLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  latitude: z.string().transform((val) => val),
  longitude: z.string().transform((val) => val),
  status: z.enum([LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE]).default(LOCATION_STATUS.ACTIVE),
});

export const updatePhysicianLocationSchema = createInsertSchema(physicianLocations).omit({
  id: true,
  physicianId: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  latitude: z.string().optional().transform((val) => val || undefined),
  longitude: z.string().optional().transform((val) => val || undefined),
  status: z.enum([LOCATION_STATUS.ACTIVE, LOCATION_STATUS.INACTIVE]).optional(),
});

export type PhysicianLocation = typeof physicianLocations.$inferSelect;
export type InsertPhysicianLocation = z.infer<typeof insertPhysicianLocationSchema>;
export type UpdatePhysicianLocation = z.infer<typeof updatePhysicianLocationSchema>;