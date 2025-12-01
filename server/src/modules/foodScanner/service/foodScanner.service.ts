import FormData from 'form-data';
import axios from 'axios';
import { config } from '../../../app/config';
import { BadRequestError } from '../../../shared/errors';

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
  foodName: string;
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
    food_items: AIFoodItem[];
  };
  message: string;
  status: number;
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

interface ScanResult {
  foodName: string;
  foodCategory: string;
  foodImage: string;
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
  };
}

export class FoodScannerService {
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
    
    if (!foodItem) {
      throw new BadRequestError('No food items found in the response');
    }

    // Calculate carbohydrate count (total carbs)
    const totalCarbs = foodItem.carbohydrates.dietaryFiber + foodItem.carbohydrates.sugar;
    const carbCount = `${Math.round(totalCarbs)}g`;

    // Map breakdown items
    const breakdown = {
      carbs: {
        name: 'Carbs',
        value: Math.round(totalCarbs),
        unit: 'g',
        position: this.calculatePosition(totalCarbs, 100),
        status: this.getStatus(totalCarbs, { good: 30, average: 60 }),
      },
      fiber: {
        name: 'Fiber',
        value: Math.round(foodItem.carbohydrates.dietaryFiber),
        unit: 'g',
        position: this.calculatePosition(foodItem.carbohydrates.dietaryFiber, 25),
        status: this.getStatus(foodItem.carbohydrates.dietaryFiber, { good: 10, average: 5 }),
      },
      sugars: {
        name: 'Sugars',
        value: Math.round(foodItem.carbohydrates.sugar),
        unit: 'g',
        position: this.calculatePosition(foodItem.carbohydrates.sugar, 50),
        status: this.getStatus(foodItem.carbohydrates.sugar, { good: 15, average: 30 }),
        isGrayed: foodItem.carbohydrates.sugar === 0,
      },
      protein: {
        name: 'Protein',
        value: Math.round(foodItem.protein.value),
        unit: 'g',
        position: this.calculatePosition(foodItem.protein.value, 50),
        status: this.getStatus(foodItem.protein.value, { good: 20, average: 10 }),
        isLocked: !isPremium && foodItem.protein.value === 0,
      },
      fat: {
        name: 'Fat',
        value: Math.round(foodItem.totalFat.saturated + foodItem.totalFat.monoUnsaturated + foodItem.totalFat.polyUnsaturated),
        unit: 'g',
        position: this.calculatePosition(foodItem.totalFat.saturated + foodItem.totalFat.monoUnsaturated + foodItem.totalFat.polyUnsaturated, 50),
        status: this.getStatus(foodItem.totalFat.saturated, { good: 10, average: 20 }),
        isGrayed: foodItem.totalFat.saturated === 0 && foodItem.totalFat.monoUnsaturated === 0 && foodItem.totalFat.polyUnsaturated === 0,
      },
      calories: {
        name: 'Calories',
        value: Math.round(foodItem.calories.value),
        unit: 'kcal',
        position: this.calculatePosition(foodItem.calories.value, 500),
        status: this.getStatus(foodItem.calories.value, { good: 200, average: 400 }),
        isGrayed: foodItem.calories.value === 0,
      },
    };

    // Determine food category (simplified - you might want to enhance this)
    const foodCategory = this.determineFoodCategory(foodItem);

    return {
      foodName: foodItem.foodName,
      foodCategory,
      foodImage: imageUrl,
      breakdown,
      nutritionalHighlight: {
        carbohydrateCount: carbCount,
        glycemicIndex: isPremium ? null : null, // Always null as per requirements
      },
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

  async scanFoodImage(imageBuffer: Buffer, imageMimetype: string, isPremium: boolean): Promise<ScanResult> {
    if (!config.ai?.baseUrl || !config.ai?.secretKey) {
      throw new BadRequestError('AI service configuration is missing');
    }

      // Create form data
      const formData = new FormData();
      formData.append('key', config.ai.secretKey);
      formData.append('food_image', imageBuffer, {
        filename: 'food.jpg',
        contentType: imageMimetype,
      });

      // Call AI API
      const response = await axios.post<AIResponse>(
        `${config.ai.baseUrl}/process`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 120000, // 30 seconds timeout
        }
      );

      if (response.data.status !== 200 || !response.data.data?.food_items?.length) {
        throw new BadRequestError(response.data.message || 'Failed to process food image');
      }

      // Create a data URL for the image (or you could store it and return a URL)
      const imageBase64 = imageBuffer.toString('base64');
      const imageUrl = `data:${imageMimetype};base64,${imageBase64}`;

      // Map the response to our consistent format
      return this.mapAIResponseToScanResult(response.data, imageUrl, isPremium);
  }
}

