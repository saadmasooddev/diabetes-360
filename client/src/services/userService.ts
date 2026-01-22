import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { User } from "@shared/schema";
import type { ApiResponse } from "server/src/app/utils/response";

class UserService {
	async getUserProfile() {
		const response = await httpClient.get<ApiResponse<User>>(
			API_ENDPOINTS.USER.PROFILE,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to fetch user profile");
		}
		return response.data;
	}
}

export const userService = new UserService();
