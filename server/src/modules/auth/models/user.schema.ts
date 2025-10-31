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
  avatar: text("avatar"),
  role: userRole().default(USER_ROLES.CUSTOMER).notNull(), // customer, admin, physician
  tier: userTier().default(USER_TIERS.FREE).notNull(), // free, paid
  isActive: boolean("is_active").default(true),
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
  avatar: true,
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


export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;