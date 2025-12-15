import FormData from 'form-data';
import axios from 'axios';
import { config } from '../../../app/config';
import { BadRequestError } from '../../../shared/errors';
import { UserRepository } from '../../user/repository/user.repository';
import { CustomerData } from '../../auth/models/user.schema';
import { FoodRepository, MealDetails, MealPlan } from '../repository/food.repository';
import { HealthService } from '../../health/service/health.service';
import { DailyPersonalizedInsight, MEAL_TYPE_ENUM , MealPlanMeal, zodMealTypeEnum } from '../models/food.schema';
import { PersonalizedInsight } from '@/features/dashboard/components/FoodScanner/PersonalizedInsight';

interface AIFoodItem {
  calories: { unit: string; value: number };
  carbohydrates: {
    addedSugar: number;
    dietaryFiber: number;
    sugar: number;
    sugarAlcohols: number;
    unit: string;
  };
  cholesterol: { unit: string; value: number };
  dairy?: { caloriesKcal: number; weightG: number };
  foodName?: string;
  fruits?: { caloriesKcal: number; weightG: number };
  healthyFats?: { caloriesKcal: number; weightG: number };
  nonHealthyFats?: { caloriesKcal: number; weightG: number };
  nonStarchyVegetables?: { caloriesKcal: number; weightG: number };
  protein: { unit: string; value: number };
  proteins?: { caloriesKcal: number; weightG: number };
  refinedGrains?: { caloriesKcal: number; weightG: number };
  sodium: { unit: string; value: number };
  starchyVegetables?: { caloriesKcal: number; weightG: number };
  sugars: { weightG: number };
  sugarsSweeteners?: { caloriesKcal: number; weightG: number };
  totalFat: {
    monoUnsaturated: number;
    polyUnsaturated: number;
    saturated: number;
    trans: number;
    unit: string;
  };
  wholeGrains?: { caloriesKcal: number; weightG: number };
}

interface AIResponse {
  data: {
    diabetes_analysis?: {
      food_name: string;
      glycemic_index: string;
      estimated_weight_of_total_food: string;
      consumption_guidance: string;
      food_category: string;
    };
    food_suggestions?: string[];
    food_items: AIFoodItem[];
  };
  message: string;
  status: number | string;
}

interface BreakdownItem {
  name: string;
  value: string | number;
  unit: string;
  position: number;
  status: 'good' | 'average' | 'danger';
  isLocked?: boolean;
  isGrayed?: boolean;
}

interface PersonalizedInsight {
  calories: string;
  recommendation: string;
  suggestedFoods: Array<{ name: string; image: string }>;
}


interface NutritionProfile { 
  carbs: number;
  fiber: number;
  sugars: number;
  protein: number;
  fat: number;
  calories: number;
}

interface ScanResult {
  foodName: string;
  foodCategory: string;
  breakdown: {
    carbs: BreakdownItem;
    fiber: BreakdownItem;
    sugars: BreakdownItem;
    protein: BreakdownItem;
    fat: BreakdownItem;
    calories: BreakdownItem;
  };
  nutritionalHighlight: {
    carbohydrateCount: string;
    glycemicIndex: string | null;
    consumptionGuidance?: string;
    estimatedWeight?: string;
  };
  recommended: NutritionProfile;
  consumed: NutritionProfile;
  foodSuggestions?: string[];
  personalizedInsight?: PersonalizedInsight;
}

interface FoodSuggestion {
    meal_type: string;
    meals: Array<MealDetails>;
}

interface NutritionalRecommendation {
  food_suggestions: FoodSuggestion[]
  nutrient_intake: {
    carbs: {
      total: number;
      sugars: number;
      fibres: number;
    };
    proteins: number;
    fats: number;
    calories: number;
  };
  personalized_insight: string[];
}

export class FoodService {

  private foodRepository: FoodRepository;
  private userRepository: UserRepository;
  private healthService: HealthService;

  constructor() {
    this.foodRepository = new FoodRepository();
    this.userRepository = new UserRepository();
    this.healthService = new HealthService();
  }
  private calculatePosition(value: number, maxValue: number = 100): number {
    if (maxValue === 0) return 0;
    const percentage = (value / maxValue) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  private getStatus(value: number, thresholds: { good: number; average: number }): 'good' | 'average' | 'danger' {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.average) return 'average';
    return 'danger';
  }

  private mapAIResponseToScanResult(aiResponse: AIResponse,  isPremium: boolean): Omit<ScanResult, "consumed" | "recommended">{
    const foodItem = aiResponse.data.food_items[0];
    const diabetesAnalysis = aiResponse.data.diabetes_analysis;
    
    if (!foodItem) {
      throw new BadRequestError('No food items found in the response');
    }

    // Get estimated weight from diabetes_analysis or use default
    const estimatedWeight = diabetesAnalysis?.estimated_weight_of_total_food 
      ? parseFloat(diabetesAnalysis.estimated_weight_of_total_food) 
      : 100; // Default to 100g if not provided

    // Calculate carbohydrate count (total carbs)
    const totalCarbs = foodItem.carbohydrates.dietaryFiber + foodItem.carbohydrates.sugar;
    const carbCount = `${Math.round(totalCarbs)}g`;

    // Calculate max values based on estimated weight (proportional scaling)
    const weightRatio = estimatedWeight / 100; // Ratio to scale from 100g base
    const maxCarbs = 100 * weightRatio;
    const maxFiber = 25 * weightRatio;
    const maxSugars = 50 * weightRatio;
    const maxProtein = 50 * weightRatio;
    const maxFat = 50 * weightRatio;
    const maxCalories = 500 * weightRatio;

    // Map breakdown items with weight-based calculations
    const breakdown = {
      carbs: {
        name: 'Carbs',
        value: Math.round(totalCarbs),
        unit: 'g',
        position: this.calculatePosition(totalCarbs, maxCarbs),
        status: this.getStatus(totalCarbs, { good: 30 * weightRatio, average: 60 * weightRatio }),
      },
      fiber: {
        name: 'Fiber',
        value: Math.round(foodItem.carbohydrates.dietaryFiber),
        unit: 'g',
        position: this.calculatePosition(foodItem.carbohydrates.dietaryFiber, maxFiber),
        status: this.getStatus(foodItem.carbohydrates.dietaryFiber, { good: 10 * weightRatio, average: 5 * weightRatio }),
      },
      sugars: {
        name: 'Sugars',
        value: Math.round(foodItem.carbohydrates.sugar),
        unit: 'g',
        position: this.calculatePosition(foodItem.carbohydrates.sugar, maxSugars),
        status: this.getStatus(foodItem.carbohydrates.sugar, { good: 15 * weightRatio, average: 30 * weightRatio }),
        isGrayed: foodItem.carbohydrates.sugar === 0,
      },
      protein: {
        name: 'Protein',
        value: Math.round(foodItem.protein.value),
        unit: 'g',
        position: this.calculatePosition(foodItem.protein.value, maxProtein),
        status: this.getStatus(foodItem.protein.value, { good: 20 * weightRatio, average: 10 * weightRatio }),
        isLocked: !isPremium && foodItem.protein.value === 0,
      },
      fat: {
        name: 'Fat',
        value: Math.round(foodItem.totalFat.saturated + foodItem.totalFat.monoUnsaturated + foodItem.totalFat.polyUnsaturated),
        unit: 'g',
        position: this.calculatePosition(foodItem.totalFat.saturated + foodItem.totalFat.monoUnsaturated + foodItem.totalFat.polyUnsaturated, maxFat),
        status: this.getStatus(foodItem.totalFat.saturated, { good: 10 * weightRatio, average: 20 * weightRatio }),
        isGrayed: foodItem.totalFat.saturated === 0 && foodItem.totalFat.monoUnsaturated === 0 && foodItem.totalFat.polyUnsaturated === 0,
      },
      calories: {
        name: 'Calories',
        value: Math.round(foodItem.calories.value),
        unit: 'kcal',
        position: this.calculatePosition(foodItem.calories.value, maxCalories),
        status: this.getStatus(foodItem.calories.value, { good: 200 * weightRatio, average: 400 * weightRatio }),
        isGrayed: foodItem.calories.value === 0,
      },
    };

    // Get food name and category from diabetes_analysis if available, otherwise use fallback
    const foodName = diabetesAnalysis?.food_name || foodItem.foodName || 'Unknown Food';
    const foodCategory = diabetesAnalysis?.food_category || this.determineFoodCategory(foodItem);
    const glycemicIndex = diabetesAnalysis?.glycemic_index || null;
    const consumptionGuidance = diabetesAnalysis?.consumption_guidance || undefined;
    const foodSuggestions = aiResponse.data.food_suggestions || undefined;

    // Create personalized insight
    const personalizedInsight: PersonalizedInsight | undefined = isPremium && foodSuggestions && foodSuggestions.length > 0
      ? {
          calories: `${Math.round(foodItem.calories.value)}${foodItem.calories.unit}`,
          recommendation: consumptionGuidance || 'Eat in Moderation',
          suggestedFoods: foodSuggestions.slice(0, 4).map(suggestion => ({
            name: suggestion,
            image: '', // Placeholder - can be enhanced with image URLs if available
          })),
        }
      : undefined;

    return {
      foodName,
      foodCategory,
      breakdown,
      nutritionalHighlight: {
        carbohydrateCount: carbCount,
        glycemicIndex: isPremium ? glycemicIndex : null,
        consumptionGuidance: isPremium ? consumptionGuidance : undefined,
        estimatedWeight: diabetesAnalysis?.estimated_weight_of_total_food,
      },
      foodSuggestions: isPremium ? foodSuggestions : undefined,
      personalizedInsight,
    };
  }

  private determineFoodCategory(foodItem: any): string {
    // Simple categorization based on food properties from AI response
    if (foodItem.fruits?.caloriesKcal > 0) return 'Fruits';
    if (foodItem.nonStarchyVegetables?.caloriesKcal > 0) return 'Vegetables';
    if (foodItem.starchyVegetables?.caloriesKcal > 0) return 'Starchy Vegetables';
    if (foodItem.proteins?.caloriesKcal > 0) return 'Proteins';
    if (foodItem.wholeGrains?.caloriesKcal > 0) return 'Whole Grains';
    if (foodItem.refinedGrains?.caloriesKcal > 0) return 'Grains';
    if (foodItem.dairy?.caloriesKcal > 0) return 'Dairy';
    // Default categorization based on food name
    const name = foodItem.foodName.toLowerCase();
    if (name.includes('fruit') || name.includes('berry') || name.includes('apple') || name.includes('banana')) return 'Fruits';
    if (name.includes('vegetable') || name.includes('salad') || name.includes('lettuce')) return 'Vegetables';
    if (name.includes('meat') || name.includes('chicken') || name.includes('fish') || name.includes('beef')) return 'Proteins';
    return 'Other';
  }

  async scanFoodImage(imageBuffer: Buffer, imageMimetype: string, isPremium: boolean, user: CustomerData, userId: string): Promise<ScanResult> {
    try {
    if (!config.ai?.baseUrl) {
      throw new BadRequestError('AI service configuration is missing');
    }

    const userInfo = {
      birthday: user.birthday,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      diabetesType: user.diabetesType,
      diagnosisDate: user.diagnosisDate,
    }

    const formData = new FormData();
    formData.append("user_info", JSON.stringify(userInfo))
    formData.append('image', imageBuffer, {
      filename: 'food.jpg',
      contentType: imageMimetype,
    });

    // Call AI API
    const response = await axios.post<AIResponse>(
      `${config.ai.baseUrl}/api/analyze-food/`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000,
      }
    );

    if (!response.data.data?.food_items?.length) {
      throw new BadRequestError(response.data.message || 'Failed to process food image');
    }

    // Handle string status codes
    if (typeof response.data.status === 'string' && response.data.status !== '200') {
      throw new BadRequestError(response.data.message || 'Failed to process food image');
    }


    // Map the response to our consistent format
    const scanResult = this.mapAIResponseToScanResult(response.data, isPremium);

    
    const breakdown = scanResult.breakdown
    
    await this.foodRepository.addFoodScanNutrients(
      userId,
      {
        carbs: Math.max(0, Number(scanResult.breakdown.carbs.value)), // Ensure non-negative
        sugars: Number(breakdown.sugars.value),
        fibres: Number(breakdown.fiber.value),
        proteins: Number(breakdown.protein.value),
        fats: Number(breakdown.fat.value),
        calories: Number(breakdown.calories.value),
      }
    );
    
    const {foodSuggestions, ...recommended }= await this.getPaidUserDailyData(userId)
    const consumed = await this.getConsumedNutrients(userId)

    return {
      ...scanResult,
      recommended,
      consumed
    };
      
    } catch (error) {
      throw new BadRequestError('Failed to scan food image. Please try again.')
    }
  }

  async getPaidUserDailyData(userId: string): Promise<NutritionProfile &  { foodSuggestions: {
      mealType: string,
      meals: MealDetails[]
    }[], foodInsights: DailyPersonalizedInsight[] }> 
  {
    if (!config.ai?.baseUrl) {
      throw new BadRequestError('AI service configuration is missing');
    }


    const today = new Date();
    const existingRecommendation = await this.foodRepository.getDailyNutrientRecommendation(userId, today);

    if (existingRecommendation) {
      // Get meal plans if they exist
      const mealPlanData = await this.foodRepository.getDailyMealPlans(userId, today);
      const perosnalizedInsights = await this.foodRepository.getDailyPersonalizedInsights(userId, today);
      const mealPlans = mealPlanData ? mealPlanData.mealPlans.reduce((acc, meal) => {

        const existing = acc.find(mp => mp.mealType === meal.mealType );
        if (existing) {
          existing.meals.push({
            name: meal.name,
            nutrition_info: {
              carbs: parseFloat(meal.carbs),
              proteins: parseFloat(meal.proteins),
              calories: parseFloat(meal.calories),
            },
          });
        } else {
          acc.push({
            mealType: meal.mealType,
            meals: [{
              name: meal.name,
              nutrition_info: {
                carbs: parseFloat(meal.carbs),
                proteins: parseFloat(meal.proteins),
                calories: parseFloat(meal.calories),
              },
            }],
          });
        }
        return acc;
      }, [] as Array<{
        mealType: string;
        meals: Array<MealDetails>;
      }>) : [];

    console.log("The food suggestions are", mealPlans, "the meal plan data", mealPlanData)
      return {
        carbs: parseFloat(existingRecommendation.carbs || '0'),
        sugars: parseFloat(existingRecommendation.sugars || '0'),
        fiber: parseFloat(existingRecommendation.fibres || '0'),
        protein: parseFloat(existingRecommendation.proteins || '0'),
        fat: parseFloat(existingRecommendation.fats || '0'),
        calories: parseFloat(existingRecommendation.calories || '0'),
        foodSuggestions: mealPlans,
        foodInsights: perosnalizedInsights
      };
    }

    // Get user info
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    const profileData = user.profileData as unknown as CustomerData;
    if (!profileData) {
      throw new BadRequestError('User profile data not found');
    }

    // Get health metrics history (last 10 days) for blood sugar, water intake, and steps
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const healthMetricsHistory = await this.healthService.getFilteredMetrics(
      userId,
      startDate,
      endDate,
      ['blood_sugar', 'water_intake', 'steps']
    );

    // Get aggregated statistics for averages
    const statistics = await this.healthService.getAggregatedStatistics(userId);

    // Format records by date for each metric type
    const formatRecordsByDate = (records: Array<{ recordedAt: Date | string; value?: string | number | null }>) => {
      const recordsByDate: Record<string, string[]> = {};
      records.forEach(record => {
        const dateStr = record.recordedAt instanceof Date 
          ? record.recordedAt.toISOString().split('T')[0]
          : new Date(record.recordedAt).toISOString().split('T')[0];
        if (!recordsByDate[dateStr]) {
          recordsByDate[dateStr] = [];
        }
        recordsByDate[dateStr].push(record.value?.toString() || '0');
      });

      // Get last 10 days of records
      const previousDaysRecords: Array<{ date: string; values: string[] }> = [];
      for (let i = 9; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        previousDaysRecords.push({
          date: dateStr,
          values: recordsByDate[dateStr] || [],
        });
      }
      return previousDaysRecords;
    };

    const bloodSugarRecords = formatRecordsByDate(healthMetricsHistory.bloodSugarRecords);
    const waterIntakeRecords = formatRecordsByDate(healthMetricsHistory.waterIntakeRecords);
    const stepsRecords = formatRecordsByDate(healthMetricsHistory.stepsRecords);

    // Format user info for API
    const birthdayDate = profileData.birthday instanceof Date 
      ? profileData.birthday 
      : new Date(profileData.birthday);
    const diagnosisDate = profileData.diagnosisDate instanceof Date 
      ? profileData.diagnosisDate 
      : new Date(profileData.diagnosisDate);

    const userInfo = {
      gender: profileData.gender,
      birthday: birthdayDate.toISOString().split('T')[0],
      diagnosisDate: diagnosisDate.toISOString().split('T')[0],
      weight: `${profileData.weight}kg`,
      height: `${profileData.height}cm`,
      diabetesType: profileData.diabetesType 
    };

    // Prepare request payload with new format
    const payload = {
      user_info: userInfo,
      blood_sugar_history: {
        average: {
          daily: statistics.glucose.daily.toString(),
          weekly: statistics.glucose.weekly.toString(),
          monthly: statistics.glucose.monthly.toString(),
        },
        previous_days_records: bloodSugarRecords.slice(0, 10), // Ensure only 10 days
      },
      water_intake_history: {
        average: {
          daily: statistics.water.daily.toFixed(1),
          weekly: statistics.water.weekly.toFixed(1),
          monthly: statistics.water.monthly.toFixed(1),
        },
        previous_days_records: waterIntakeRecords.slice(0, 10),
      },
      walking_steps_history: {
        average: {
          daily: statistics.steps.daily.toString(),
          weekly: statistics.steps.weekly.toString(),
          monthly: statistics.steps.monthly.toString(),
        },
        previous_days_records: stepsRecords.slice(0, 10),
      },
    };

    // Call AI API
    const response = await axios.post<{
      data: NutritionalRecommendation;
      message: string;
      status: number | string;
    }>(
      `${config.ai.baseUrl}/api/nutritional-recommendation/`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    if (response.data.status !== 200 && response.data.status !== '200') {
      throw new BadRequestError(response.data.message || 'Failed to get nutritional recommendations');
    }

    const nutrientData = response.data.data.nutrient_intake;
    const foodSuggestionsResponse = response.data.data.food_suggestions || [];
    const insights = response.data.data.personalized_insight || [];
    
    // Calculate carbs (total - sugars - fibres)
    const carbs = nutrientData.carbs.total - nutrientData.carbs.sugars - nutrientData.carbs.fibres;

    // Store recommendation in database
    await this.foodRepository.upsertDailyNutrientRecommendation({
      userId,
      recommendationDate: today,
      carbs,
      sugars: nutrientData.carbs.sugars,
      fibres: nutrientData.carbs.fibres,
      proteins: nutrientData.proteins,
      fats: nutrientData.fats,
      calories: nutrientData.calories,
    });

    
    const allMeals: Array<MealPlan> = []

    const foodSuggestions: Array<{
      mealType: string,
      meals:  MealDetails[]
    }> = []

    foodSuggestionsResponse.forEach(mealPlan => {
      foodSuggestions.push({
        mealType: mealPlan.meal_type,
        meals: mealPlan.meals,
      })

      mealPlan.meals.forEach(meal => {
        allMeals.push({
          mealType: mealPlan.meal_type, 
          name: meal.name,
          carbs: meal.nutrition_info.carbs,
          proteins: meal.nutrition_info.proteins,
          calories: meal.nutrition_info.calories,
        })
      });
    });

    if (allMeals.length > 0) {
      await this.foodRepository.upsertDailyMealPlan(userId, today, allMeals);
    }

    const foodInsights = await this.foodRepository.upsertDailyPersonalizedInsights(userId, today, insights);

    console.log("The food suggestions are", foodSuggestions)
    return {
      carbs,
      sugars: nutrientData.carbs.sugars,
      fiber: nutrientData.carbs.fibres,
      protein: nutrientData.proteins,
      fat: nutrientData.fats,
      calories: nutrientData.calories,
      foodSuggestions: foodSuggestions,
      foodInsights
    };
  }

  async getConsumedNutrients(userId: string): Promise<NutritionProfile> {
    const today = new Date();
    const consumed = await this.foodRepository.getConsumedNutrients(userId, today);

    return {
      carbs: parseFloat(consumed?.carbs || '0'),
      sugars: parseFloat(consumed?.sugars || '0'),
      fiber: parseFloat(consumed?.fibres || '0'),
      protein: parseFloat(consumed?.proteins || '0'),
      fat: parseFloat(consumed?.fats || '0'),
      calories: parseFloat(consumed?.calories || '0'),
    };
  }
}


