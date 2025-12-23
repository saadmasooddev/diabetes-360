import { db } from "../../../app/config/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  dailyNutrientRecommendations,
  foodScanNutrients,
  dailyMealPlans,
  mealPlanMeals,
  dailyPersonalizedInsights,
  recipes,
  type DailyNutrientRecommendation,
  type InsertDailyNutrientRecommendation,
  type FoodScanNutrients,
  type MealPlanMeal,
  type DailyPersonalizedInsight,
  type Recipe,
} from "../models/food.schema";
import { sql as rawSql } from "drizzle-orm";

export interface RecipeIngredients {
  "main_ingredients": {
    "heading": string;
    "items": string[];
  },
  "sub_ingredients": {
    "heading": string;
    "items": string[];
  }
}

export interface MealDetails {
  name: string
  nutrition_info: {
    carbs: number;
    proteins: number;
    calories: number;
  };
}

export interface MealPlan {
  mealType: string;
  name: string;
  carbs: number;
  proteins: number;
  calories: number;
}

export class FoodRepository {
  // Get daily nutrient recommendation for a user on a specific date
  async getDailyNutrientRecommendation(
    userId: string,
    date: Date = new Date()
  ): Promise<DailyNutrientRecommendation | null> {
    const dateStr = date.toISOString().split('T')[0];
    const [recommendation] = await db
      .select()
      .from(dailyNutrientRecommendations)
      .where(
        and(
          eq(dailyNutrientRecommendations.userId, userId),
          eq(dailyNutrientRecommendations.recommendationDate, dateStr as any)
        )
      )
      .limit(1);
    
    return recommendation || null;
  }

  // Create or update daily nutrient recommendation
  async upsertDailyNutrientRecommendation(
    data: InsertDailyNutrientRecommendation
  ): Promise<DailyNutrientRecommendation> {
    const dateStr = data.recommendationDate instanceof Date 
      ? data.recommendationDate.toISOString().split('T')[0]
      : data.recommendationDate;

    // Try to update existing record
    const [updated] = await db
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
          eq(dailyNutrientRecommendations.recommendationDate, dateStr as any)
        )
      )
      .returning();

    if (updated) {
      return updated;
    }

    // If no existing record, create a new one
    const [newRecommendation] = await db
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

  // Get consumed nutrients for a user on a specific date
  async getConsumedNutrients(
    userId: string,
    date: Date = new Date()
  ): Promise<FoodScanNutrients | null> {
    const dateStr = date.toISOString().split('T')[0];
    const [consumed] = await db
      .select()
      .from(foodScanNutrients)
      .where(
        and(
          eq(foodScanNutrients.userId, userId),
          eq(foodScanNutrients.scanDate, dateStr as any)
        )
      )
      .limit(1);
    
    return consumed || null;
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
    date: Date = new Date()
  ): Promise<FoodScanNutrients> {
    const dateStr = date.toISOString().split('T')[0];

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
          eq(foodScanNutrients.scanDate, dateStr as any)
        )
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
    date: Date = new Date()
  ): Promise<{ mealPlans: MealPlanMeal[] }> {
    const dateStr = date.toISOString().split('T')[0];
    const [mealPlan]= await db
      .select()
      .from(dailyMealPlans)
      .where(
        and(
          eq(dailyMealPlans.userId, userId),
          eq(dailyMealPlans.planDate, dateStr as any)
        )
      )
    
    if (!mealPlan) {
      return { mealPlans: []};
    }

    const meals = await db
      .select()
      .from(mealPlanMeals)
      .where(eq(mealPlanMeals.mealPlanId, mealPlan.id));

    return { mealPlans: meals };
  }

  // Create or update daily meal plan with meals
  async upsertDailyMealPlan(
    userId: string,
    planDate: Date,
    meals: Array<MealPlan>
  ): Promise<{ meals: MealPlanMeal[] }> {
    const dateStr = planDate instanceof Date 
      ? planDate.toISOString().split('T')[0]
      : planDate;

    const existing = await this.getDailyMealPlans(userId, planDate);
    if(existing.mealPlans.length > 0) {


      await db.delete(mealPlanMeals).where(eq(mealPlanMeals.mealPlanId, existing.mealPlans[0].mealPlanId))

      const promises = meals.map(async(mp) => 
       {
        const [meal] = await db.insert(mealPlanMeals).values({
          mealPlanId: existing.mealPlans[0].mealPlanId,
          mealType: mp.mealType as any,
          name: mp.name,
          carbs: mp.carbs.toString(),
          proteins:mp.proteins.toString(),
          calories:mp.calories.toString(),
        }).returning()
        return meal
       }
       
      )

      const insertedMeals = await Promise.all(promises)
      return { meals: insertedMeals }
    }

    const [mealPlan] = await db.insert(dailyMealPlans).values({ userId, planDate: dateStr }).returning();
    // Insert meals
    const insertedMeals = await db
      .insert(mealPlanMeals)
      .values(
        meals.map(meal => ({
          mealPlanId: mealPlan.id,
          mealType: meal.mealType as any,
          name: meal.name,
          carbs: meal.carbs.toString(),
          proteins: meal.proteins.toString(),
          calories: meal.calories.toString(),
        }))
      )
      .returning();

    return { meals: insertedMeals };
  }

  // Get daily personalized insights for a user on a specific date
  async getDailyPersonalizedInsights(
    userId: string,
    date: Date = new Date()
  ): Promise<DailyPersonalizedInsight[]> {
    const dateStr = date.toISOString().split('T')[0];
    const insights = await db
      .select()
      .from(dailyPersonalizedInsights)
      .where(
        and(
          eq(dailyPersonalizedInsights.userId, userId),
          eq(dailyPersonalizedInsights.insightDate, dateStr as any)
        )
      );
    
    return insights;
  }

  // Create or replace daily personalized insights
  async upsertDailyPersonalizedInsights(
    userId: string,
    insightDate: Date,
    insights: string[]
  ): Promise<DailyPersonalizedInsight[]> {
    const dateStr = insightDate instanceof Date 
      ? insightDate.toISOString().split('T')[0]
      : insightDate;

    // Delete existing insights for this date
    await db
      .delete(dailyPersonalizedInsights)
      .where(
        and(
          eq(dailyPersonalizedInsights.userId, userId),
          eq(dailyPersonalizedInsights.insightDate, dateStr as any)
        )
      );

    // Insert new insights
    if (insights.length > 0) {
      const inserted = await db
        .insert(dailyPersonalizedInsights)
        .values(
          insights.map(insightText => ({
            userId,
            insightDate: dateStr as any,
            insightText,
          }))
        )
        .returning();
      
      return inserted;
    }

    return [];
  }

  async findMealByTypeAndName(
    userId: string,
    mealType: string,
    mealName: string
  ): Promise<MealPlanMeal | null> {
    const [meal] = await db
      .select({ meal: mealPlanMeals })
      .from(mealPlanMeals)
      .innerJoin(dailyMealPlans, eq(mealPlanMeals.mealPlanId, dailyMealPlans.id))
      .where(
        and(
          eq(dailyMealPlans.userId, userId),
          eq(mealPlanMeals.mealType, mealType as any),
          rawSql`LOWER(${mealPlanMeals.name}) = LOWER(${mealName})`
        )
      )
      .limit(1);

    return meal?.meal || null;
  }

  async getRecipeByMealId(mealId: string): Promise<Recipe | null> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.mealId, mealId)).limit(1);
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

