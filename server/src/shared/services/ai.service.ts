import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { config } from "../../app/config";
import { BadRequestError } from "../errors";
import type { MealDetails } from "server/src/modules/food/repository/food.repository";
import { BLOOD_SUGAR_READING_TYPES_ENUM, CHAT_ROLES } from "@shared/schema";

/**
 * AI Service Response Types
 */
export interface AIBaseResponse<T> {
  data: T;
  message: string;
  status: number | string;
}

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

export interface FoodScanResponse {
  diabetes_analysis?: {
    food_name: string;
    glycemic_index: string;
    estimated_weight_of_total_food: string;
    consumption_guidance: string;
    food_category: string;
  };
  food_suggestions?: string[];
  food_items: AIFoodItem[];
}

interface FoodSuggestion {
  meal_type: string;
  meals: Array<MealDetails>;
}

interface NutritionalRecommendation {
  food_suggestions: FoodSuggestion[];
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

export interface RecipeGenerationResponse {
  title: string;
  description: string;
  ingredients: any;
  making_steps: any;
}

export interface HealthAssessmentInsightsResponse {
  insights: Array<{
    name: "glucose" | "water" | "steps" | "heart_rate";
    insight: string;
  }>;
  overall_health_summary: string;
  what_to_do_next: Array<{ name: string; tip: string }>;
}

export interface HealthAssessmentPreviousHistory {
  daily: string;
  weekly: string;
  monthly: string;
  targets: {
    recommended_target: string;
    user_target: string;
  };
}
export interface HealthAssessmentInsightsPayload {
  user_info: {
    name: string;
    gender: string;
    birthday: string;
    weight: string;
    height: string;
    diabetesType: string;
    diagnosisDate?: string;
  };
  glucose_history: HealthAssessmentPreviousHistory;
  walking_steps_history: HealthAssessmentPreviousHistory;
  heartRate_history: HealthAssessmentPreviousHistory;
}

/** Payload for AI /chat/ endpoint (DiaBot) */
export interface AIChatPayload {
  user_info: {
    name: string;
    gender: string;
    birthday: string;
    weight: string;
    height: string;
    diabetesType: string;
    diagnosisDate?: string;
  };
  health_summary: {
    last_24_hours: {
      blood_sugar: {
        fasting_sugar: Array<{ value: string; recorded_at: string }>;
        random_sugar: Array<{ value: string; recorded_at: string }>;
        current_sugar: Array<{ value: string; recorded_at: string }>;
      };
      steps: Array<{ value: string; recorded_at: string }>;
      heart_rate: Array<{ value: string; recorded_at: string }>;
      meals: Array<{
        mealDate: string;
        foodName: string;
        carbs: string;
        sugars: string;
        fibres: string;
        proteins: string;
        fats: string;
        calories: string;
      }>;
    };
    last_days_health_summary: Array<{ date: string; summary: string }>;
  };
  current_section_messages: Array<{
    role: CHAT_ROLES;
    content: string;
  }>;
  old_chat_memory: Array<{ date: string; chat_memory: string }>;
  current_message: string;
  emotional_state?: {
    mood: string;
    motivation_level: string;
    stress_signals: string[];
    confidence: string;
  };
  behavior_patterns?: {
    late_dinner: boolean;
    evening_inactivity: boolean;
    missed_logs_frequency: "yes" | "no";
  };
}

export interface AIChatResponse {
  reply?: string;
}

export interface LastDaysHealthSummaryPayload {
  today_data: {
    recorded_at: string;
    blood_sugar: AIChatPayload["health_summary"]["last_24_hours"]["blood_sugar"];
    steps: Array<{ value: string }>;
    heart_rate: Array<{ value: string }>;
    meals: Array<{
      foodName: string;
      carbs: string;
      sugars: string;
      fibres: string;
      proteins: string;
      fats: string;
      calories: string;
    }>;
  };
}

export interface LastDaysHealthSummaryResponse {
  data: {
    last_day_summary: string;
  };
  message: string;
  status: number | string;
}

export interface OldChatMemoryPayload {
  messages: Array<{
    role: CHAT_ROLES;
    content: string;
  }>;
}

export interface OldChatMemoryResponse {
  data: {
    suggested_memories: string[];
  };
  message: string;
  status: number | string;
}

/** Payload for AI POST /api/chat/emotional-state/ */
export interface EmotionalStatePayload {
  conversation: Array<{
    role: CHAT_ROLES;
    content: string;
  }>;
}

/** Response from AI POST /api/chat/emotional-state/ */
export interface EmotionalStateResponse {
  data: {
    mood: string;
    motivation_level: string;
    stress_signals: string[];
    confidence: string;
  };
  message: string;
  status: number | string;
}

class AIService {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 120000; // 2 minutes

  constructor() {
    if (!config.ai?.baseUrl) {
      throw new Error("AI service base URL is not configured");
    }
    this.baseUrl = config.ai.baseUrl;
  }

  private validateResponse<T>(
    response: AIBaseResponse<T>,
    validateData?: (data: T) => boolean,
  ): void {
    // Handle string status codes
    if (typeof response.status === "string" && response.status !== "200") {
      throw new BadRequestError(
        response.message || "AI service returned an error",
      );
    }

    // Handle numeric status codes
    if (typeof response.status === "number" && response.status !== 200) {
      throw new BadRequestError(
        response.message || "AI service returned an error",
      );
    }

    // Custom validation if provided
    if (validateData && !validateData(response.data)) {
      throw new BadRequestError(
        response.message || "Invalid response data from AI service",
      );
    }
  }

  /**
   * Analyze food image
   */
  async analyzeFood(
    imageBuffer: Buffer,
    imageMimetype: string,
    userInfo: Record<string, any>,
  ): Promise<AIBaseResponse<FoodScanResponse>> {
    try {
      const formData = new FormData();
      formData.append("user_info", JSON.stringify(userInfo));
      formData.append("image", imageBuffer, {
        filename: "food.jpg",
        contentType: imageMimetype,
      });

      const response = await axios.post<AIBaseResponse<FoodScanResponse>>(
        `${this.baseUrl}/api/analyze-food/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: this.defaultTimeout,
        },
      );

      this.validateResponse(response.data, (data) => {
        return !!(data.food_items && data.food_items.length > 0);
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new BadRequestError(
          "Failed to scan food image. Please try again.",
        );
      }
      throw error;
    }
  }

  /**
   * Get nutritional recommendations
   */
  async getNutritionalRecommendation(
    payload: Record<string, any>,
  ): Promise<AIBaseResponse<NutritionalRecommendation>> {
    const response = await axios.post<
      AIBaseResponse<NutritionalRecommendation>
    >(`${this.baseUrl}/api/nutritional-recommendation/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
    });

    this.validateResponse(response.data);

    return response.data;
  }

  /**
   * Generate recipe
   */
  async generateRecipe(
    payload: Record<string, any>,
  ): Promise<AIBaseResponse<RecipeGenerationResponse>> {
    const response = await axios.post<AIBaseResponse<RecipeGenerationResponse>>(
      `${this.baseUrl}/api/recipe-generation/`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.defaultTimeout,
      },
    );

    this.validateResponse(response.data);

    return response.data;
  }

  async getHealthAssessmentInsights(
    payload: HealthAssessmentInsightsPayload,
  ): Promise<AIBaseResponse<HealthAssessmentInsightsResponse>> {
    const response = await axios.post<
      AIBaseResponse<HealthAssessmentInsightsResponse>
    >(`${this.baseUrl}/api/health-assessment-insights/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
    });

    this.validateResponse(response.data, (data) => {
      return !!(
        data.insights &&
        data.overall_health_summary &&
        data.what_to_do_next
      );
    });

    return response.data;
  }

  async analyzeGlucoseMeterImage(
    imageBuffer: Buffer,
    imageMimetype: string,
  ): Promise<AIBaseResponse<{ blood_sugar_reading: string }>> {
    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "glucose_meter_reading.jpg",
      contentType: imageMimetype,
    });
    const response = await axios.post<
      AIBaseResponse<{ blood_sugar_reading: string }>
    >(`${this.baseUrl}/api/extract-blood-sugar-reading/`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: this.defaultTimeout,
    });
    this.validateResponse(response.data, (data) => !!data.blood_sugar_reading);
    return response.data;
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<
    AIBaseResponse<{
      transcription_text: string;
      total_response_time_sec: number;
      audio_duration_min: number;
      estimated_cost: number;
    }>
  > {
    const formData = new FormData();
    formData.append("audio", audioBuffer, {
      filename: "audio.wav",
      contentType: "audio/wav",
    });
    const response = await axios.post<
      AIBaseResponse<{
        transcription_text: string;
        total_response_time_sec: number;
        audio_duration_min: number;
        estimated_cost: number;
      }>
    >(`${this.baseUrl}/api/transcribe-audio/`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: this.defaultTimeout,
    });
    this.validateResponse(
      response.data,
      (data) => typeof data?.transcription_text === "string",
    );
    return response.data;
  }

  async chat(payload: AIChatPayload): Promise<AIBaseResponse<AIChatResponse>> {
    const response = await axios.post<AIBaseResponse<AIChatResponse>>(
      `${this.baseUrl}/api/chat/`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: this.defaultTimeout,
      },
    );

    this.validateResponse(response.data, (data) => {
      return !!data.reply;
    });

    return response.data;
  }

  async getLastDaysHealthSummary(
    payload: LastDaysHealthSummaryPayload,
  ): Promise<AIBaseResponse<LastDaysHealthSummaryResponse["data"]>> {
    const response = await axios.post<
      AIBaseResponse<LastDaysHealthSummaryResponse["data"]>
    >(`${this.baseUrl}/api/chat/last-days-health-summary/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
    });

    this.validateResponse(response.data, (data) => {
      return !!(
        data &&
        typeof data.last_day_summary === "string" &&
        data.last_day_summary.length > 0
      );
    });

    return response.data;
  }

  async getOldChatMemory(
    payload: OldChatMemoryPayload,
  ): Promise<AIBaseResponse<OldChatMemoryResponse["data"]>> {
    const response = await axios.post<
      AIBaseResponse<OldChatMemoryResponse["data"]>
    >(`${this.baseUrl}/api/chat/old-chat-memory/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
    });

    this.validateResponse(response.data, (data) => {
      return (
        Array.isArray(data?.suggested_memories) &&
        data.suggested_memories.every((m): m is string => typeof m === "string")
      );
    });

    return response.data;
  }

  async getEmotionalState(
    payload: EmotionalStatePayload,
  ): Promise<AIBaseResponse<EmotionalStateResponse["data"]>> {
    const response = await axios.post<
      AIBaseResponse<EmotionalStateResponse["data"]>
    >(`${this.baseUrl}/api/chat/emotional-state/`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.defaultTimeout,
    });

    this.validateResponse(response.data, (data) => {
      return (
        typeof data?.mood === "string" &&
        typeof data?.motivation_level === "string" &&
        Array.isArray(data?.stress_signals) &&
        data.stress_signals.every((s): s is string => typeof s === "string") &&
        typeof data?.confidence === "string"
      );
    });

    return response.data;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for testing
export { AIService };
