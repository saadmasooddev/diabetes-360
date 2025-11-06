import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const USER_TIERS = {
  FREE: "free",
  PAID: "paid",
} as const;

export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  PHYSICIAN: "physician",
} as const;

export const userTierEnum = z.enum([USER_TIERS.FREE, USER_TIERS.PAID]);
export const userTier = pgEnum("tier",[USER_TIERS.FREE, USER_TIERS.PAID]);

export const userRoleEnum = z.enum([USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.PHYSICIAN]);
export const userRole = pgEnum("user_role",[USER_ROLES.CUSTOMER, USER_ROLES.ADMIN, USER_ROLES.PHYSICIAN]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  password: text("password"), // Made optional for OAuth providers
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  provider: text("provider").notNull().default("manual"), // manual, google, apple, facebook
  providerId: text("provider_id"), // External provider ID
  role: userRole().default(USER_ROLES.CUSTOMER).notNull(), // customer, admin, physician
  tier: userTier().default(USER_TIERS.FREE).notNull(), // free, paid
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
  username: true,
  fullName: true,
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
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender").notNull(), // 'male' or 'female'
  birthDay: text("birth_day").notNull(),
  birthMonth: text("birth_month").notNull(),
  birthYear: text("birth_year").notNull(),
  diagnosisDay: text("diagnosis_day").notNull(),
  diagnosisMonth: text("diagnosis_month").notNull(),
  diagnosisYear: text("diagnosis_year").notNull(),
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
});

// Schema for admin creating customer data (dates optional, diabetesType required)
export const insertCustomerDataAdminSchema = createInsertSchema(customerData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  birthDay: z.string().min(1, "Birth day is required"),
  birthMonth: z.string().min(1, "Birth month is required"),
  birthYear: z.string().min(1, "Birth year is required"),
  diagnosisDay: z.string().min(1, "Diagnosis day is required"),
  diagnosisMonth: z.string().min(1, "Diagnosis month is required"),
  diagnosisYear: z.string().min(1, "Diagnosis year is required"),
  weight: z.string().min(1, "Weight is required"),
  height: z.string().min(1, "Height is required"),
  diabetesType: z.string().min(1, "Diabetes type is required"),
});

export const updateCustomerDataSchema = createInsertSchema(customerData).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

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
