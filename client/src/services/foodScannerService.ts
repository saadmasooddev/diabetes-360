import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import type { ScanResult } from "@/mocks/scanResults";

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
}

export const foodScannerService = new FoodScannerService();
