import { BadRequestError } from "../../../shared/errors";
import { UserRepository } from "../../user/repository/user.repository";
import type { CustomerData } from "../../auth/models/user.schema";
import {
	FoodRepository,
	RecommendedNutrients,
	type MealDetails,
	type MealPlan,
} from "../repository/food.repository";
import { HealthService } from "../../health/service/health.service";
import type {
	DailyPersonalizedInsight,
	MEAL_TYPE_ENUM,
	LoggedMeal,
	InsertLoggedMeal,
} from "../models/food.schema";
import { PersonalizedInsight } from "@/features/dashboard/components/FoodScanner/PersonalizedInsight";
import { formatUserInfo } from "server/src/shared/utils/utils";
import {
	type FoodScanResponse,
	aiService,
	type RecipeGenerationResponse,
} from "../../../shared/services/ai.service";
import { EXERCISE_TYPE_ENUM } from "@shared/schema";
import { dbUtils } from "server/src/app/config/db";
import { resourceLimits } from "worker_threads";

interface BreakdownItem {
	name: string;
	value: string | number;
	unit: string;
	position: number;
	status: "good" | "average" | "danger";
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

interface RecipeGenerationInput {
	name: string;
	mealType: (typeof MEAL_TYPE_ENUM)[keyof typeof MEAL_TYPE_ENUM];
	nutrition_info: {
		carbs: number;
		proteins: number;
		calories: number;
	};
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

	private getStatus(
		value: number,
		thresholds: { good: number; average: number },
	): "good" | "average" | "danger" {
		if (value <= thresholds.good) return "good";
		if (value <= thresholds.average) return "average";
		return "danger";
	}

	private mapAIResponseToScanResult(
		aiResponse: FoodScanResponse,
		isPremium: boolean,
	): Omit<ScanResult, "consumed" | "recommended"> {
		const foodItem = aiResponse.food_items[0];
		const diabetesAnalysis = aiResponse.diabetes_analysis;

		if (!foodItem) {
			throw new BadRequestError("No food items found in the response");
		}

		// Get estimated weight from diabetes_analysis or use default
		const estimatedWeight = diabetesAnalysis?.estimated_weight_of_total_food
			? parseFloat(diabetesAnalysis.estimated_weight_of_total_food)
			: 100; // Default to 100g if not provided

		// Calculate carbohydrate count (total carbs)
		const totalCarbs =
			foodItem.carbohydrates.dietaryFiber + foodItem.carbohydrates.sugar;
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
				name: "Carbs",
				value: Math.round(totalCarbs),
				unit: "g",
				position: this.calculatePosition(totalCarbs, maxCarbs),
				status: this.getStatus(totalCarbs, {
					good: 30 * weightRatio,
					average: 60 * weightRatio,
				}),
			},
			fiber: {
				name: "Fiber",
				value: Math.round(foodItem.carbohydrates.dietaryFiber),
				unit: "g",
				position: this.calculatePosition(
					foodItem.carbohydrates.dietaryFiber,
					maxFiber,
				),
				status: this.getStatus(foodItem.carbohydrates.dietaryFiber, {
					good: 10 * weightRatio,
					average: 5 * weightRatio,
				}),
			},
			sugars: {
				name: "Sugars",
				value: Math.round(foodItem.carbohydrates.sugar),
				unit: "g",
				position: this.calculatePosition(
					foodItem.carbohydrates.sugar,
					maxSugars,
				),
				status: this.getStatus(foodItem.carbohydrates.sugar, {
					good: 15 * weightRatio,
					average: 30 * weightRatio,
				}),
				isGrayed: foodItem.carbohydrates.sugar === 0,
			},
			protein: {
				name: "Protein",
				value: Math.round(foodItem.protein.value),
				unit: "g",
				position: this.calculatePosition(foodItem.protein.value, maxProtein),
				status: this.getStatus(foodItem.protein.value, {
					good: 20 * weightRatio,
					average: 10 * weightRatio,
				}),
				isLocked: !isPremium && foodItem.protein.value === 0,
			},
			fat: {
				name: "Fat",
				value: Math.round(
					foodItem.totalFat.saturated +
						foodItem.totalFat.monoUnsaturated +
						foodItem.totalFat.polyUnsaturated,
				),
				unit: "g",
				position: this.calculatePosition(
					foodItem.totalFat.saturated +
						foodItem.totalFat.monoUnsaturated +
						foodItem.totalFat.polyUnsaturated,
					maxFat,
				),
				status: this.getStatus(foodItem.totalFat.saturated, {
					good: 10 * weightRatio,
					average: 20 * weightRatio,
				}),
				isGrayed:
					foodItem.totalFat.saturated === 0 &&
					foodItem.totalFat.monoUnsaturated === 0 &&
					foodItem.totalFat.polyUnsaturated === 0,
			},
			calories: {
				name: "Calories",
				value: Math.round(foodItem.calories.value),
				unit: "kcal",
				position: this.calculatePosition(foodItem.calories.value, maxCalories),
				status: this.getStatus(foodItem.calories.value, {
					good: 200 * weightRatio,
					average: 400 * weightRatio,
				}),
				isGrayed: foodItem.calories.value === 0,
			},
		};

		// Get food name and category from diabetes_analysis if available, otherwise use fallback
		const foodName =
			diabetesAnalysis?.food_name || foodItem.foodName || "Unknown Food";
		const foodCategory =
			(diabetesAnalysis as any)?.food_category ||
			this.determineFoodCategory(foodItem);
		const glycemicIndex = diabetesAnalysis?.glycemic_index || null;
		const consumptionGuidance =
			(diabetesAnalysis as any)?.consumption_guidance || undefined;
		const foodSuggestions = aiResponse.food_suggestions || undefined;

		// Create personalized insight
		const personalizedInsight: PersonalizedInsight | undefined =
			isPremium && foodSuggestions && foodSuggestions.length > 0
				? {
						calories: `${Math.round(foodItem.calories.value)}${foodItem.calories.unit}`,
						recommendation: consumptionGuidance || "Eat in Moderation",
						suggestedFoods: foodSuggestions
							.slice(0, 4)
							.map((suggestion: string) => ({
								name: suggestion,
								image: "", // Placeholder - can be enhanced with image URLs if available
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
		if (foodItem.fruits?.caloriesKcal > 0) return "Fruits";
		if (foodItem.nonStarchyVegetables?.caloriesKcal > 0) return "Vegetables";
		if (foodItem.starchyVegetables?.caloriesKcal > 0)
			return "Starchy Vegetables";
		if (foodItem.proteins?.caloriesKcal > 0) return "Proteins";
		if (foodItem.wholeGrains?.caloriesKcal > 0) return "Whole Grains";
		if (foodItem.refinedGrains?.caloriesKcal > 0) return "Grains";
		if (foodItem.dairy?.caloriesKcal > 0) return "Dairy";
		// Default categorization based on food name
		const name = foodItem.foodName.toLowerCase();
		if (
			name.includes("fruit") ||
			name.includes("berry") ||
			name.includes("apple") ||
			name.includes("banana")
		)
			return "Fruits";
		if (
			name.includes("vegetable") ||
			name.includes("salad") ||
			name.includes("lettuce")
		)
			return "Vegetables";
		if (
			name.includes("meat") ||
			name.includes("chicken") ||
			name.includes("fish") ||
			name.includes("beef")
		)
			return "Proteins";
		return "Other";
	}

	async scanFoodImage(
		imageBuffer: Buffer,
		imageMimetype: string,
		isPremium: boolean,
		user: CustomerData,
		userId: string,
		date: string,
	): Promise<ScanResult> {
		const userInfo = formatUserInfo(user);

		// Call AI service
		const response = await aiService.analyzeFood(
			imageBuffer,
			imageMimetype,
			userInfo,
		);

		// Map the response to our consistent format
		const scanResult = this.mapAIResponseToScanResult(response.data, isPremium);

		const breakdown = scanResult.breakdown;

		// Don't automatically add nutrients - user must explicitly log the meal
		const [{ foodSuggestions, ...recommended }, consumed] = await Promise.all([
			await this.getPaidUserDailyData(userId, date),
			await this.getConsumedNutrients(userId, date),
		]);

		return {
			...scanResult,
			recommended,
			consumed,
		};
	}

	async getPaidUserDailyData(
		userId: string,
		date: string,
	): Promise<
		NutritionProfile & {
			foodSuggestions: {
				mealType: string;
				meals: MealDetails[];
			}[];
			foodInsights: DailyPersonalizedInsight[];
		}
	> {
		const today = date;
		const existingRecommendation =
			await this.foodRepository.getDailyNutrientRecommendation(userId, today);

		if (existingRecommendation) {
			const [mealPlanData, perosnalizedInsights] = await Promise.all([
				await this.foodRepository.getDailyMealPlans(userId, today),
				await this.foodRepository.getDailyPersonalizedInsights(userId, today),
			]);
			const mealPlans = mealPlanData
				? mealPlanData.mealPlans.reduce(
						(acc, meal) => {
							const existing = acc.find((mp) => mp.mealType === meal.mealType);
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
									meals: [
										{
											name: meal.name,
											nutrition_info: {
												carbs: parseFloat(meal.carbs),
												proteins: parseFloat(meal.proteins),
												calories: parseFloat(meal.calories),
											},
										},
									],
								});
							}
							return acc;
						},
						[] as Array<{
							mealType: string;
							meals: Array<MealDetails>;
						}>,
					)
				: [];

			return {
				carbs: parseFloat(existingRecommendation.carbs || "0"),
				sugars: parseFloat(existingRecommendation.sugars || "0"),
				fiber: parseFloat(existingRecommendation.fibres || "0"),
				protein: parseFloat(existingRecommendation.proteins || "0"),
				fat: parseFloat(existingRecommendation.fats || "0"),
				calories: parseFloat(existingRecommendation.calories || "0"),
				foodSuggestions: mealPlans,
				foodInsights: perosnalizedInsights,
			};
		}

		// Get user info
		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new BadRequestError("User not found");
		}

		const profileData = user.profileData as unknown as CustomerData;
		if (!profileData) {
			throw new BadRequestError("User profile data not found");
		}

		// Get health metrics history (last 10 days) for blood sugar, water intake, and steps
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 10);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(23, 59, 59, 999);

		const healthMetricsHistory = await this.healthService.getFilteredMetrics(
			userId,
			startDate.toISOString(),
			endDate.toISOString(),
			[
				EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE,
				EXERCISE_TYPE_ENUM.WATER_INTAKE,
				EXERCISE_TYPE_ENUM.STEPS,
			],
		);

		// Get aggregated statistics for averages
		const statistics = await this.healthService.getAggregatedStatistics(
			userId,
			startDate.toISOString(),
		);

		// Format records by date for each metric type
		const formatRecordsByDate = (
			records: Array<{
				recordedAt: Date | string;
				value?: string | number | null;
			}>,
		) => {
			const recordsByDate: Record<string, string[]> = {};
			records.forEach((record) => {
				const dateStr =
					record.recordedAt instanceof Date
						? record.recordedAt.toISOString().split("T")[0]
						: new Date(record.recordedAt).toISOString().split("T")[0];
				if (!recordsByDate[dateStr]) {
					recordsByDate[dateStr] = [];
				}
				recordsByDate[dateStr].push(record.value?.toString() || "0");
			});

			// Get last 10 days of records
			const previousDaysRecords: Array<{ date: string; values: string[] }> = [];
			for (let i = 9; i >= 0; i--) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				const dateStr = date.toISOString().split("T")[0];
				previousDaysRecords.push({
					date: dateStr,
					values: recordsByDate[dateStr] || [],
				});
			}
			return previousDaysRecords;
		};

		const bloodSugarRecords = formatRecordsByDate(
			healthMetricsHistory.bloodSugarRecords,
		);
		const waterIntakeRecords = formatRecordsByDate(
			healthMetricsHistory.waterIntakeRecords,
		);
		const stepsRecords = formatRecordsByDate(healthMetricsHistory.stepsRecords);

		// Format user info for API
		const userInfo = formatUserInfo(profileData as unknown as CustomerData);

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

		// Call AI service
		const response = await aiService.getNutritionalRecommendation(payload);
		console.log("The payload for daily data is", payload);
		console.log("THe response received is", response);

		const nutrientData: RecommendedNutrients = response.data.nutrient_intake;
		const foodSuggestionsResponse = response.data.food_suggestions || [];
		const insights = response.data.personalized_insight || [];

		// Calculate carbs (total - sugars - fibres)
		const carbs =
			nutrientData.carbs.total -
			nutrientData.carbs.sugars -
			nutrientData.carbs.fibres;

		const allMeals: Array<MealPlan> = [];

		const foodSuggestions: Array<{
			mealType: string;
			meals: MealDetails[];
		}> = [];

		foodSuggestionsResponse.forEach((mealPlan) => {
			foodSuggestions.push({
				mealType: mealPlan.meal_type,
				meals: mealPlan.meals,
			});

			mealPlan.meals.forEach((meal) => {
				allMeals.push({
					mealType: mealPlan.meal_type as MEAL_TYPE_ENUM,
					name: meal.name,
					carbs: meal.nutrition_info.carbs,
					proteins: meal.nutrition_info.proteins,
					calories: meal.nutrition_info.calories,
				});
			});
		});

		const result = await dbUtils.transaction(async (tx) => {
			await this.foodRepository.upsertDailyNutrientRecommendation(
				{
					userId,
					recommendationDate: today,
					carbs,
					sugars: nutrientData.carbs.sugars,
					fibres: nutrientData.carbs.fibres,
					proteins: nutrientData.proteins,
					fats: nutrientData.fats,
					calories: nutrientData.calories,
				},
				tx,
			);

			if (allMeals.length > 0) {
				await this.foodRepository.upsertDailyMealPlan(
					userId,
					today,
					allMeals,
					tx,
				);
			}

			const foodInsights =
				await this.foodRepository.upsertDailyPersonalizedInsights(
					userId,
					today,
					insights,
					tx,
				);

			return { foodInsights };
		});

		return {
			carbs,
			sugars: nutrientData.carbs.sugars,
			fiber: nutrientData.carbs.fibres,
			protein: nutrientData.proteins,
			fat: nutrientData.fats,
			calories: nutrientData.calories,
			foodSuggestions: foodSuggestions,
			foodInsights: result.foodInsights,
		};
	}

	async getConsumedNutrients(
		userId: string,
		dateStr: string,
	): Promise<NutritionProfile> {
		const consumed = await this.foodRepository.getConsumedNutrients(
			userId,
			dateStr,
		);

		return {
			carbs: parseFloat(consumed?.carbs || "0"),
			sugars: parseFloat(consumed?.sugars || "0"),
			fiber: parseFloat(consumed?.fibres || "0"),
			protein: parseFloat(consumed?.proteins || "0"),
			fat: parseFloat(consumed?.fats || "0"),
			calories: parseFloat(consumed?.calories || "0"),
		};
	}

	async logMeal(
		userId: string,
		meal: Omit<InsertLoggedMeal, "userId" | "mealDate">,
		dateStr: string,
	): Promise<LoggedMeal> {
		return await this.foodRepository.logMeal(userId, meal, dateStr);
	}

	async generateRecipe(
		userId: string,
		payload: RecipeGenerationInput,
	): Promise<RecipeGenerationResponse> {
		// Ensure meal exists for this user
		const meal = await this.foodRepository.findMealByTypeAndName(
			userId,
			payload.mealType,
			payload.name,
		);

		if (!meal) {
			throw new BadRequestError(
				"Meal not found in your meal plans. Please pick a valid meal.",
			);
		}

		// Return cached recipe if exists
		const existingRecipe = await this.foodRepository.getRecipeByMealId(meal.id);
		if (existingRecipe) {
			return {
				title: existingRecipe.title,
				description: existingRecipe.description,
				ingredients: existingRecipe.ingredients,
				making_steps: existingRecipe.makingSteps,
			};
		}

		// Get user profile for AI payload
		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new BadRequestError("User not found");
		}

		const profileData = user.profileData as unknown as CustomerData;
		if (!profileData) {
			throw new BadRequestError("User profile data not found");
		}

		const aiPayload = {
			meal: {
				type: meal.mealType,
				name: meal.name,
				nutrition_info: {
					carbs: Number(meal.carbs),
					proteins: Number(meal.proteins),
					calories: Number(meal.calories),
				},
			},
			user_info: formatUserInfo(profileData as unknown as CustomerData),
		};

		// Call AI service
		const response = await aiService.generateRecipe(aiPayload);

		const recipeData = response.data;

		// Persist recipe for reuse
		await this.foodRepository.createRecipe({
			mealId: meal.id,
			title: recipeData.title,
			description: recipeData.description,
			ingredients: recipeData.ingredients,
			makingSteps: recipeData.making_steps,
		});

		return {
			title: recipeData.title,
			description: recipeData.description,
			ingredients: recipeData.ingredients,
			making_steps: recipeData.making_steps,
		};
	}
}
