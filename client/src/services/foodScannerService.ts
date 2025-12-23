import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import type { ScanResult } from "@/mocks/scanResults";
import { DailyPersonalizedInsight } from "@shared/schema";

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

export interface NutritionProfile { 
  carbs: number;
  fiber: number;
  sugars: number;
  protein: number;
  fat: number;
  calories: number;
}

export interface MealDetails {
  name: string
  nutrition_info: {
    carbs: number;
    proteins: number;
    calories: number;
  };
}

export interface FoodSuggestion {

  mealType: string,
  meals: MealDetails[]

}

export interface DailyUserData extends NutritionProfile { foodSuggestions?: FoodSuggestion[], foodInsights?: DailyPersonalizedInsight[]}

export interface ConsumedNutrients extends NutritionProfile {}

class FoodScannerService {
  async scanFoodImage(file: File): Promise<ScanResult> {
    const formData = new FormData();
    formData.append("food_image", file);

    const response = await httpClient.post<ApiResponse<ScanResult>>(
      API_ENDPOINTS.FOOD_SCANNER.SCAN,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to scan food image");
    }

    return response.data;
  }

  async getNutritionRequirements(): Promise<DailyUserData> {
    const response = await httpClient.get<ApiResponse<DailyUserData>>(
      API_ENDPOINTS.FOOD_SCANNER.DAILY_DATA
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to get nutrition requirements");
    }

    return response.data;
  }

  async getConsumedNutrients(): Promise<ConsumedNutrients | null> {
    const response = await httpClient.get<ApiResponse<ConsumedNutrients | null>>(
      API_ENDPOINTS.FOOD_SCANNER.NUTRITION_CONSUMED
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
    const response = await httpClient.post<ApiResponse<{
      title: string;
      description: string;
      ingredients: RecipeIngredients[];
      making_steps: string[];
    }>>(API_ENDPOINTS.FOOD_SCANNER.RECIPE_DETAILS, payload);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get recipe details');
    }

    return response.data;
  }

}

export const foodScannerService = new FoodScannerService();
