import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

/**
 * Two-Factor Authentication (2FA) Table
 * Normalized to 3NF:
 * - Separated from users table to maintain normalization
 * - One record per user (1:1 relationship)
 * - Stores TOTP secret, backup codes, and enabled status
 */
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  secret: text("secret").notNull(), // Encrypted TOTP secret
  backupCodes: text("backup_codes"), // JSON array of hashed backup codes
  enabled: boolean("enabled").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(), // Whether user has verified 2FA setup
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTwoFactorAuthSchema = createInsertSchema(twoFactorAuth)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = z.infer<typeof insertTwoFactorAuthSchema>;
export type UpdateTwoFactorAuth = z.infer<typeof updateTwoFactorAuthSchema>;

