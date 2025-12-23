import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, numeric, date, text, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../../auth/models/user.schema";

export const mealTypeEnum = pgEnum("meal_type_enum", ["Breakfast", "Lunch", "Dinner"]); 
export const MEAL_TYPE_ENUM = {
  Breakfast: "Breakfast",
  Lunch: "Lunch",
  Dinner: "Dinner"
}

export const zodMealTypeEnum = z.enum([MEAL_TYPE_ENUM.Breakfast, MEAL_TYPE_ENUM.Lunch, MEAL_TYPE_ENUM.Dinner]);

// Daily Nutrient Recommendations Table - stores AI-generated recommendations per user per day
export const dailyNutrientRecommendations = pgTable("daily_nutrient_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recommendationDate: date("recommendation_date").notNull().default(sql`CURRENT_DATE`),
  carbs: numeric("carbs", { precision: 10, scale: 2 }).notNull(), // carbs.total - carbs.sugars - carbs.fibres
  sugars: numeric("sugars", { precision: 10, scale: 2 }).notNull(),
  fibres: numeric("fibres", { precision: 10, scale: 2 }).notNull(),
  proteins: numeric("proteins", { precision: 10, scale: 2 }).notNull(),
  fats: numeric("fats", { precision: 10, scale: 2 }).notNull(),
  calories: numeric("calories", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Food Scan Nutrients Table - tracks consumed nutrients from each food scan
export const foodScanNutrients = pgTable("food_scan_nutrients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scanDate: date("scan_date").notNull().default(sql`CURRENT_DATE`),
  carbs: numeric("carbs", { precision: 10, scale: 2 }).notNull().default("0"),
  sugars: numeric("sugars", { precision: 10, scale: 2 }).notNull().default("0"),
  fibres: numeric("fibres", { precision: 10, scale: 2 }).notNull().default("0"),
  proteins: numeric("proteins", { precision: 10, scale: 2 }).notNull().default("0"),
  fats: numeric("fats", { precision: 10, scale: 2 }).notNull().default("0"),
  calories: numeric("calories", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDailyNutrientRecommendationSchema = createInsertSchema(dailyNutrientRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().min(1),
  recommendationDate: z.string().or(z.date()),
  carbs: z.number().min(0),
  sugars: z.number().min(0),
  fibres: z.number().min(0),
  proteins: z.number().min(0),
  fats: z.number().min(0),
  calories: z.number().min(0),
  foodSuggestions: z.string().optional().nullable(),
});

export const insertFoodScanNutrientsSchema = createInsertSchema(foodScanNutrients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().min(1),
  scanDate: z.string().or(z.date()),
  carbs: z.number().min(0).optional(),
  sugars: z.number().min(0).optional(),
  fibres: z.number().min(0).optional(),
  proteins: z.number().min(0).optional(),
  fats: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
});


// Daily Meal Plans Table - stores meal plan recommendations per user per day
export const dailyMealPlans = pgTable("daily_meal_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planDate: date("plan_date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Meal Plan Meals Table - stores individual meals within meal plans (normalized to 3NF)
export const mealPlanMeals = pgTable("meal_plan_meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealPlanId: varchar("meal_plan_id").notNull().references(() => dailyMealPlans.id, { onDelete: "cascade" }),
  mealType: mealTypeEnum("meal_type").notNull(), // Breakfast, Lunch, Dinner
  name: text("name").notNull(), // e.g., "Oatmeal with berries"
  carbs: numeric("carbs", { precision: 10, scale: 2 }).notNull(),
  proteins: numeric("proteins", { precision: 10, scale: 2 }).notNull(),
  calories: numeric("calories", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Daily Personalized Insights Table - stores personalized insights per user per day
export const dailyPersonalizedInsights = pgTable("daily_personalized_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightDate: date("insight_date").notNull().default(sql`CURRENT_DATE`),
  insightText: text("insight_text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recipes Table - stores AI generated recipes linked to a specific meal
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").notNull().references(() => mealPlanMeals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ingredients: jsonb("ingredients").notNull().default(sql`'[]'::jsonb`),
  makingSteps: jsonb("making_steps").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDailyMealPlanSchema = createInsertSchema(dailyMealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().min(1),
  planDate: z.string().or(z.date()),
});

export const insertMealPlanMealSchema = createInsertSchema(mealPlanMeals).omit({
  id: true,
  createdAt: true,
}).extend({
  mealPlanId: z.string().min(1),
  mealType: z.enum(["Breakfast", "Lunch", "Dinner"]),
  name: z.string().min(1),
  carbs: z.number().min(0),
  proteins: z.number().min(0),
  calories: z.number().min(0),
});

export const insertDailyPersonalizedInsightSchema = createInsertSchema(dailyPersonalizedInsights).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().min(1),
  insightDate: z.string().or(z.date()),
  insightText: z.string().min(1),
});

export type DailyNutrientRecommendation = typeof dailyNutrientRecommendations.$inferSelect;
export type InsertDailyNutrientRecommendation = z.infer<typeof insertDailyNutrientRecommendationSchema>;
export type FoodScanNutrients = typeof foodScanNutrients.$inferSelect;
export type InsertFoodScanNutrients = z.infer<typeof insertFoodScanNutrientsSchema>;
export type DailyMealPlan = typeof dailyMealPlans.$inferSelect;
export type InsertDailyMealPlan = z.infer<typeof insertDailyMealPlanSchema>;
export type MealPlanMeal = typeof mealPlanMeals.$inferSelect;
export type InsertMealPlanMeal = z.infer<typeof insertMealPlanMealSchema>;
export type DailyPersonalizedInsight = typeof dailyPersonalizedInsights.$inferSelect;
export type InsertDailyPersonalizedInsight = z.infer<typeof insertDailyPersonalizedInsightSchema>;
export type Recipe = typeof recipes.$inferSelect;

