import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import { CHAT_ROLES } from "@shared/schema";

export interface ChatMessageDto {
	id: string;
	recordedAt: string;
	chatDate: string;
	userId: string;
	role: CHAT_ROLES;
	message: string;
}

export interface GetChatResponse {
	messages: ChatMessageDto[];
}

export interface SendMessageResponse {
	assistantMessage: string;
}

class ChatService {
	async getChatByDate(date: string): Promise<GetChatResponse> {
		const response = await httpClient.get<ApiResponse<GetChatResponse>>(
			`${API_ENDPOINTS.CHAT.BASE}?date=${encodeURIComponent(date)}`,
		);
		if (!response.success) {
			throw new Error(response.message ?? "Failed to fetch chat");
		}
		return {
			messages: response.data?.messages ?? [],
		};
	}

	async sendMessage(
		date: string,
		message: string,
	): Promise<SendMessageResponse> {
		const response = await httpClient.post<ApiResponse<SendMessageResponse>>(
			API_ENDPOINTS.CHAT.BASE,
			{ date, message },
		);
		if (!response.success) {
			throw new Error(response.message ?? "Failed to send message");
		}
		return {
			assistantMessage: response.data?.assistantMessage ?? "",
		};
	}
}

export const chatService = new ChatService();
