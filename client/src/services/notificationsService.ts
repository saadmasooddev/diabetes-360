import { API_ENDPOINTS } from "@/config/endpoints";
import { ApiResponse } from "@/types/auth.types";
import { httpClient } from "@/utils/httpClient";
import { FcmRegistrationInput } from "@shared/schema";

export class NotificationsService {
	async saveFcmToken(data: FcmRegistrationInput) {
		const response = await httpClient.post<ApiResponse>(
			API_ENDPOINTS.NOTIFICATIONS.STORE_FCM_TOKEN,
			data,
		);
		if (!response.success) {
			throw new Error(response.message || "Failed to save FCM token");
		}
	}
}

export const notificationsService = new NotificationsService();
