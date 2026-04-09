import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import type { ScanResult } from "@/mocks/scanResults";
import type { DailyPersonalizedInsight } from "@shared/schema";
import { DateManager } from "@/lib/utils";

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

export interface NutritionProfile {
	carbs: number;
	fiber: number;
	sugars: number;
	protein: number;
	fat: number;
	calories: number;
}

export interface MealDetails {
	name: string;
	nutrition_info: {
		carbs: number;
		proteins: number;
		calories: number;
	};
}

export interface FoodSuggestion {
	mealType: string;
	meals: MealDetails[];
}

export interface DailyUserData extends NutritionProfile {
	foodSuggestions?: FoodSuggestion[];
	foodInsights?: DailyPersonalizedInsight[];
}

export interface ConsumedNutrients extends NutritionProfile {}

export interface LoggedMealRow {
	id: string;
	userId: string;
	mealDate: string;
	foodName: string;
	carbs: string;
	sugars: string;
	fibres: string;
	proteins: string;
	fats: string;
	calories: string;
	recordedAt: Date;
	createdAt?: string;
	updatedAt?: string;
}

export interface CalorieProfileResponse {
	meals: LoggedMealRow[];
	total: number;
	calorieIntake: Array<{ value: number; recordedAt: Date }>;
}

class FoodScannerService {
	async scanFoodImage(file: File): Promise<ScanResult> {
		const formData = new FormData();
		formData.append("food_image", file);
		formData.append("date", DateManager.formatDate(new Date()));

		const response = await httpClient.post<ApiResponse<ScanResult>>(
			API_ENDPOINTS.FOOD_SCANNER.SCAN,
			formData,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to scan food image");
		}

		return response.data;
	}

	async getNutritionRequirements(): Promise<DailyUserData> {
		const response = await httpClient.get<ApiResponse<DailyUserData>>(
			`${API_ENDPOINTS.FOOD_SCANNER.DAILY_DATA}?date=${DateManager.formatDate(new Date())}`,
		);

		if (!response.success || !response.data) {
			throw new Error(
				response.message || "Failed to get nutrition requirements",
			);
		}

		return response.data;
	}

	async getConsumedNutrients(): Promise<ConsumedNutrients | null> {
		const response = await httpClient.get<
			ApiResponse<ConsumedNutrients | null>
		>(
			`${API_ENDPOINTS.FOOD_SCANNER.NUTRITION_CONSUMED}?date=${DateManager.formatDate(new Date())}`,
		);

		if (!response.success) {
			throw new Error(response.message || "Failed to get consumed nutrients");
		}

		return response.data || null;
	}

	async getRecipeDetails(payload: {
		name: string;
		mealType: string;
		nutrition_info: {
			carbs: number;
			proteins: number;
			calories: number;
		};
	}) {
		const response = await httpClient.post<
			ApiResponse<{
				title: string;
				description: string;
				ingredients: RecipeIngredients[];
				making_steps: string[];
			}>
		>(API_ENDPOINTS.FOOD_SCANNER.RECIPE_DETAILS, payload);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to get recipe details");
		}

		return response.data;
	}

	async logMeal(payload: {
		foodName: string;
		carbs: number;
		sugars: number;
		fibres: number;
		proteins: number;
		fats: number;
		calories: number;
	}) {
		const p = {
			...payload,
			recordedAt: new Date().toISOString(),
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		const response = await httpClient.post<ApiResponse<any>>(
			`${API_ENDPOINTS.FOOD_SCANNER.LOG_MEAL}?date=${DateManager.formatDate(new Date())}`,
			p,
		);

		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to log meal");
		}

		return response.data;
	}
}

export const foodScannerService = new FoodScannerService();
