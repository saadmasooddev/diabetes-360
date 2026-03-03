import { db } from "../../../app/config/db";
import { eq, and, sql, inArray, asc, getTableColumns } from "drizzle-orm";
import {
	dailyNutrientRecommendations,
	foodScanNutrients,
	loggedMeals,
	dailyMealPlans,
	mealPlanMeals,
	dailyPersonalizedInsights,
	recipes,
	type DailyNutrientRecommendation,
	type InsertDailyNutrientRecommendation,
	type FoodScanNutrients,
	type LoggedMeal,
	type InsertLoggedMeal,
	type MealPlanMeal,
	type DailyPersonalizedInsight,
	type Recipe,
	MEAL_TYPE_ENUM,
	Tx,
} from "../models/food.schema";
import { sql as rawSql } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { timeZones } from "../models/timeZone.schema";

export interface RecommendedNutrients {
	carbs: {
		total: number;
		sugars: number;
		fibres: number;
	};
	proteins: number;
	fats: number;
	calories: number;
}

export interface RecipeIngredients {
	main_ingredients: {
		heading: string;
		items: string[];
	};
	sub_ingredients: {
		heading: string;
		items: string[];
	};
}

export interface MealDetails {
	name: string;
	nutrition_info: {
		carbs: number;
		proteins: number;
		calories: number;
	};
}

export interface MealPlan {
	mealType: MEAL_TYPE_ENUM;
	name: string;
	carbs: number;
	proteins: number;
	calories: number;
}

export class FoodRepository {
	// Get daily nutrient recommendation for a user on a specific date
	async getDailyNutrientRecommendation(
		userId: string,
		date: string,
	): Promise<DailyNutrientRecommendation | null> {
		const [recommendation] = await db
			.select()
			.from(dailyNutrientRecommendations)
			.where(
				and(
					eq(dailyNutrientRecommendations.userId, userId),
					eq(dailyNutrientRecommendations.recommendationDate, date),
				),
			)
			.limit(1);

		return recommendation || null;
	}

	// Create or update daily nutrient recommendation
	async upsertDailyNutrientRecommendation(
		data: InsertDailyNutrientRecommendation,
		tx?: Tx,
	): Promise<DailyNutrientRecommendation> {
		const dateStr =
			data.recommendationDate instanceof Date
				? data.recommendationDate.toISOString().split("T")[0]
				: data.recommendationDate;

		const dbConn = tx || db;
		const [updated] = await dbConn

			.update(dailyNutrientRecommendations)
			.set({
				carbs: data.carbs.toString(),
				sugars: data.sugars.toString(),
				fibres: data.fibres.toString(),
				proteins: data.proteins.toString(),
				fats: data.fats.toString(),
				calories: data.calories.toString(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(dailyNutrientRecommendations.userId, data.userId),
					eq(dailyNutrientRecommendations.recommendationDate, dateStr),
				),
			)
			.returning();

		if (updated) {
			return updated;
		}

		// If no existing record, create a new one
		const [newRecommendation] = await dbConn
			.insert(dailyNutrientRecommendations)
			.values({
				userId: data.userId,
				recommendationDate: dateStr as any,
				carbs: data.carbs.toString(),
				sugars: data.sugars.toString(),
				fibres: data.fibres.toString(),
				proteins: data.proteins.toString(),
				fats: data.fats.toString(),
				calories: data.calories.toString(),
			})
			.returning();

		return newRecommendation;
	}

	/**
	 * Get count of logged meals for a user between two dates (inclusive).
	 * Uses DATE cast for consistent date-range comparison.
	 */
	async getLoggedMealsCount(
		userId: string,
		startDateStr: string,
		endDateStr: string,
	): Promise<number> {
		const [row] = await db
			.select({
				count: sql<number>`count(*)::int`,
			})
			.from(loggedMeals)
			.where(
				and(
					eq(loggedMeals.userId, userId),
					sql`DATE(${loggedMeals.mealDate}) >= DATE(${startDateStr})`,
					sql`DATE(${loggedMeals.mealDate}) <= DATE(${endDateStr})`,
				),
			);
		return row?.count ?? 0;
	}

	// Get consumed nutrients for a user on a specific date (from logged meals only)
	async getConsumedNutrients(
		userId: string,
		dateStr: string,
	): Promise<FoodScanNutrients | null> {
		// Aggregate nutrients from all logged meals for the date
		const [aggregated] = await db
			.select({
				carbs: sql<string>`COALESCE(SUM(${loggedMeals.carbs})::text, '0')`,
				sugars: sql<string>`COALESCE(SUM(${loggedMeals.sugars})::text, '0')`,
				fibres: sql<string>`COALESCE(SUM(${loggedMeals.fibres})::text, '0')`,
				proteins: sql<string>`COALESCE(SUM(${loggedMeals.proteins})::text, '0')`,
				fats: sql<string>`COALESCE(SUM(${loggedMeals.fats})::text, '0')`,
				calories: sql<string>`COALESCE(SUM(${loggedMeals.calories})::text, '0')`,
			})
			.from(loggedMeals)
			.where(
				and(
					eq(loggedMeals.userId, userId),
					eq(loggedMeals.mealDate, dateStr as any),
				),
			);

		if (
			!aggregated ||
			(aggregated.carbs === "0" && aggregated.calories === "0")
		) {
			return null;
		}

		// Return in the same format as FoodScanNutrients
		return {
			id: "",
			userId,
			scanDate: dateStr as any,
			carbs: aggregated.carbs,
			sugars: aggregated.sugars,
			fibres: aggregated.fibres,
			proteins: aggregated.proteins,
			fats: aggregated.fats,
			calories: aggregated.calories,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	/**
	 * Get diet trend for last 7 days: average recommended vs logged calories.
	 */
	async getDietTrendLast7Days(userId: string): Promise<{
		avgRecommendedCalories: number;
		avgLoggedCalories: number;
		totalRecommended: number;
		totalLogged: number;
	}> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 6);
		const startStr = startDate.toISOString().split("T")[0];
		const endStr = endDate.toISOString().split("T")[0];

		const recRows = await db
			.select({
				calories: dailyNutrientRecommendations.calories,
				recommendationDate: dailyNutrientRecommendations.recommendationDate,
			})
			.from(dailyNutrientRecommendations)
			.where(
				and(
					eq(dailyNutrientRecommendations.userId, userId),
					sql`DATE(${dailyNutrientRecommendations.recommendationDate}) >= DATE(${startStr})`,
					sql`DATE(${dailyNutrientRecommendations.recommendationDate}) <= DATE(${endStr})`,
				),
			);

		const loggedRows = await db
			.select({
				calories: sql<string>`COALESCE(SUM(${loggedMeals.calories})::text, '0')`,
			})
			.from(loggedMeals)
			.where(
				and(
					eq(loggedMeals.userId, userId),
					sql`DATE(${loggedMeals.mealDate}) >= DATE(${startStr})`,
					sql`DATE(${loggedMeals.mealDate}) <= DATE(${endStr})`,
				),
			);

		const totalRecommended = recRows.reduce(
			(sum, r) => sum + parseFloat(r.calories?.toString() || "0"),
			0,
		);
		const totalLogged = parseFloat(loggedRows[0]?.calories?.toString() || "0");
		const dayCount = recRows.length || 1;

		return {
			avgRecommendedCalories: Math.round(totalRecommended / dayCount),
			avgLoggedCalories: Math.round(totalLogged / 7),
			totalRecommended,
			totalLogged: Math.round(totalLogged),
		};
	}

	/**
	 * Get macros (carbs, protein, fat) from logged meals for last 7 days.
	 */
	async getMacrosLast7Days(userId: string): Promise<{
		carbs: number;
		protein: number;
		fat: number;
		calories: number;
		carbsPercent: number;
		proteinPercent: number;
		fatPercent: number;
	}> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 6);
		const startStr = startDate.toISOString().split("T")[0];
		const endStr = endDate.toISOString().split("T")[0];

		const [row] = await db
			.select({
				carbs: sql<string>`COALESCE(SUM(${loggedMeals.carbs})::text, '0')`,
				proteins: sql<string>`COALESCE(SUM(${loggedMeals.proteins})::text, '0')`,
				fats: sql<string>`COALESCE(SUM(${loggedMeals.fats})::text, '0')`,
				calories: sql<string>`COALESCE(SUM(${loggedMeals.calories})::text, '0')`,
			})
			.from(loggedMeals)
			.where(
				and(
					eq(loggedMeals.userId, userId),
					sql`DATE(${loggedMeals.mealDate}) >= DATE(${startStr})`,
					sql`DATE(${loggedMeals.mealDate}) <= DATE(${endStr})`,
				),
			);

		const carbs = parseFloat(row?.carbs?.toString() || "0");
		const protein = parseFloat(row?.proteins?.toString() || "0");
		const fat = parseFloat(row?.fats?.toString() || "0");
		const calories = parseFloat(row?.calories?.toString() || "0");
		const totalGrams = carbs + protein + fat || 1;
		return {
			carbs,
			protein,
			fat,
			calories,
			carbsPercent: Math.round((carbs / totalGrams) * 100),
			proteinPercent: Math.round((protein / totalGrams) * 100),
			fatPercent: Math.round((fat / totalGrams) * 100),
		};
	}

	/**
	 * Get all logged meals for a user on a specific date.
	 * Uses DATE cast for consistent results.
	 */
	async getLoggedMealsByDate(userId: string, dateStr: string) {
		return db
			.select()
			.from(loggedMeals)
			.where(
				and(
					eq(loggedMeals.userId, userId),
					sql`DATE(${loggedMeals.mealDate}) = DATE(${dateStr})`,
				),
			)
			.orderBy(asc(loggedMeals.createdAt));
	}

	async getLoggedMealsInDateRange(
		userId: string,
		startDateStr: string,
		endDateStr: string,
	) {
		return db
			.select({
				...getTableColumns(loggedMeals),
				timeZone: timeZones.name,
			})
			.from(loggedMeals)
			.innerJoin(timeZones, eq(loggedMeals.timeZoneId, timeZones.id))
			.where(
				and(
					eq(loggedMeals.userId, userId),
					sql`DATE(${loggedMeals.createdAt}) >= DATE(${startDateStr})`,
					sql`DATE(${loggedMeals.createdAt}) <= DATE(${endDateStr})`,
				),
			)
			.orderBy(asc(loggedMeals.createdAt));
	}

	// Log a meal (explicitly logged by user after scanning)
	async logMeal(
		userId: string,
		meal: Omit<InsertLoggedMeal, "userId" | "mealDate">,
		dateStr: string,
	): Promise<LoggedMeal> {
		const [logged] = await db
			.insert(loggedMeals)
			.values({
				userId,
				mealDate: dateStr as any,
				foodName: meal.foodName,
				carbs: meal.carbs.toString(),
				sugars: meal.sugars.toString(),
				fibres: meal.fibres.toString(),
				proteins: meal.proteins.toString(),
				fats: meal.fats.toString(),
				calories: meal.calories.toString(),
				recordedAt: meal.recordedAt,
				timeZoneId: meal.timeZoneId,
			})
			.returning();

		return logged;
	}

	// Add nutrients from a food scan (increment existing or create new)
	async addFoodScanNutrients(
		userId: string,
		nutrients: {
			carbs: number;
			sugars: number;
			fibres: number;
			proteins: number;
			fats: number;
			calories: number;
		},
		date: Date = new Date(),
	): Promise<FoodScanNutrients> {
		const dateStr = date.toISOString().split("T")[0];

		// Try to update existing record by adding to current values
		const [updated] = await db
			.update(foodScanNutrients)
			.set({
				carbs: sql`${foodScanNutrients.carbs} + ${nutrients.carbs}`,
				sugars: sql`${foodScanNutrients.sugars} + ${nutrients.sugars}`,
				fibres: sql`${foodScanNutrients.fibres} + ${nutrients.fibres}`,
				proteins: sql`${foodScanNutrients.proteins} + ${nutrients.proteins}`,
				fats: sql`${foodScanNutrients.fats} + ${nutrients.fats}`,
				calories: sql`${foodScanNutrients.calories} + ${nutrients.calories}`,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(foodScanNutrients.userId, userId),
					eq(foodScanNutrients.scanDate, dateStr as any),
				),
			)
			.returning();

		if (updated) {
			return updated;
		}

		// If no existing record, create a new one
		const [newConsumed] = await db
			.insert(foodScanNutrients)
			.values({
				userId,
				scanDate: dateStr as any,
				carbs: nutrients.carbs.toString(),
				sugars: nutrients.sugars.toString(),
				fibres: nutrients.fibres.toString(),
				proteins: nutrients.proteins.toString(),
				fats: nutrients.fats.toString(),
				calories: nutrients.calories.toString(),
			})
			.returning();

		return newConsumed;
	}

	// Get daily meal plan for a user on a specific date
	async getDailyMealPlans(
		userId: string,
		date: string,
		tx?: Tx,
	): Promise<{ mealPlans: MealPlanMeal[] }> {
		const dbConn = tx || db;
		const [mealPlan] = await dbConn
			.select()
			.from(dailyMealPlans)
			.where(
				and(
					eq(dailyMealPlans.userId, userId),
					eq(dailyMealPlans.planDate, date),
				),
			);

		if (!mealPlan) {
			return { mealPlans: [] };
		}

		const meals = await dbConn
			.select()
			.from(mealPlanMeals)
			.where(eq(mealPlanMeals.mealPlanId, mealPlan.id));

		return { mealPlans: meals };
	}

	// Create or update daily meal plan with meals
	async upsertDailyMealPlan(
		userId: string,
		dateStr: string,
		meals: Array<MealPlan>,
		tx?: Tx,
		// recommendedNutrients: RecommendedNutrients
	): Promise<{ meals: MealPlanMeal[] }> {
		const existing = await this.getDailyMealPlans(userId, dateStr, tx);

		const dbConn = tx || db;
		if (existing.mealPlans.length > 0) {
			await dbConn
				.delete(mealPlanMeals)
				.where(eq(mealPlanMeals.mealPlanId, existing.mealPlans[0].mealPlanId));
			const insertedMeals = await dbConn
				.insert(mealPlanMeals)
				.values(
					meals.map((mp) => ({
						mealPlanId: existing.mealPlans[0].mealPlanId,
						mealType: mp.mealType,
						name: mp.name,
						carbs: mp.carbs.toString(),
						proteins: mp.proteins.toString(),
						calories: mp.calories.toString(),
					})),
				)
				.returning();
			return { meals: insertedMeals };
		}

		const [mealPlan] = await dbConn
			.insert(dailyMealPlans)
			.values({
				userId,
				planDate: dateStr,
				// total_carbs: recommendedNutrients.carbs.total,
				// sugars: recommendedNutrients.carbs.sugars,
				// fibres: recommendedNutrients.carbs.fibres,
				// calories: recommendedNutrients.calories,
				// proteins: recommendedNutrients.proteins,
				// fats: recommendedNutrients.fats,
			})
			.returning();
		// Insert meals
		const insertedMeals = await dbConn
			.insert(mealPlanMeals)
			.values(
				meals.map((meal) => ({
					mealPlanId: mealPlan.id,
					mealType: meal.mealType,
					name: meal.name,
					carbs: meal.carbs.toString(),
					proteins: meal.proteins.toString(),
					calories: meal.calories.toString(),
				})),
			)
			.returning();

		return { meals: insertedMeals };
	}

	// Get daily personalized insights for a user on a specific date
	async getDailyPersonalizedInsights(
		userId: string,
		dateStr: string,
	): Promise<DailyPersonalizedInsight[]> {
		const insights = await db
			.select()
			.from(dailyPersonalizedInsights)
			.where(
				and(
					eq(dailyPersonalizedInsights.userId, userId),
					eq(dailyPersonalizedInsights.insightDate, dateStr),
				),
			);

		return insights;
	}

	// Create or replace daily personalized insights
	async upsertDailyPersonalizedInsights(
		userId: string,
		insightDate: string,
		insights: string[],
		tx?: Tx,
	): Promise<DailyPersonalizedInsight[]> {
		// Delete existing insights for this date
		const dbConn = tx || db;
		await dbConn
			.delete(dailyPersonalizedInsights)
			.where(
				and(
					eq(dailyPersonalizedInsights.userId, userId),
					eq(dailyPersonalizedInsights.insightDate, insightDate),
				),
			);

		// Insert new insights
		if (insights.length > 0) {
			const inserted = await dbConn
				.insert(dailyPersonalizedInsights)
				.values(
					insights.map((insightText) => ({
						userId,
						insightDate,
						insightText,
					})),
				)
				.returning();

			return inserted;
		}

		return [];
	}

	async findMealByTypeAndName(
		userId: string,
		mealType: string,
		mealName: string,
	): Promise<MealPlanMeal | null> {
		const [meal] = await db
			.select({ meal: mealPlanMeals })
			.from(mealPlanMeals)
			.innerJoin(
				dailyMealPlans,
				eq(mealPlanMeals.mealPlanId, dailyMealPlans.id),
			)
			.where(
				and(
					eq(dailyMealPlans.userId, userId),
					eq(mealPlanMeals.mealType, mealType as any),
					rawSql`LOWER(${mealPlanMeals.name}) = LOWER(${mealName})`,
				),
			)
			.limit(1);

		return meal?.meal || null;
	}

	async getRecipeByMealId(mealId: string): Promise<Recipe | null> {
		const [recipe] = await db
			.select()
			.from(recipes)
			.where(eq(recipes.mealId, mealId))
			.limit(1);
		return recipe || null;
	}

	async createRecipe(data: {
		mealId: string;
		title: string;
		description: string;
		ingredients: RecipeIngredients[];
		makingSteps: string[];
	}): Promise<Recipe> {
		const [recipe] = await db
			.insert(recipes)
			.values({
				mealId: data.mealId,
				title: data.title,
				description: data.description,
				ingredients: data.ingredients,
				makingSteps: data.makingSteps,
			})
			.returning();

		return recipe;
	}
}
