import FormData from 'form-data';
import axios from 'axios';
import { config } from '../../../app/config';
import { BadRequestError } from '../../../shared/errors';
import { UserRepository } from '../../user/repository/user.repository';
import { CustomerData } from '../../auth/models/user.schema';

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
  foodSuggestions?: string[];
  personalizedInsight?: PersonalizedInsight;
}

export class FoodScannerService {
  private readonly userRepository: UserRepository
  constructor() {
    this.userRepository = new UserRepository()

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

  private mapAIResponseToScanResult(aiResponse: AIResponse, imageUrl: string, isPremium: boolean): ScanResult {
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

  async scanFoodImage(imageBuffer: Buffer, imageMimetype: string, isPremium: boolean, user: CustomerData): Promise<ScanResult> {
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

    // Create a data URL for the image (or you could store it and return a URL)
    const imageBase64 = imageBuffer.toString('base64');
    const imageUrl = `data:${imageMimetype};base64,${imageBase64}`;

    // Map the response to our consistent format
    return this.mapAIResponseToScanResult(response.data, imageUrl, isPremium);
  }
}


