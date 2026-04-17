import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type { ApiResponse } from "@/types/auth.types";
import { CHAT_ROLES, ChatMessage } from "@shared/schema";

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
	nudge?: string;
}

export interface TranscribeAudioResponse {
	transcription_text: string;
}

class ChatService {
	async getChatByDate(
		date: string,
		{ offset, limit }: { offset: number; limit: number },
	): Promise<GetChatResponse> {
		const response = await httpClient.get<ApiResponse<GetChatResponse>>(
			`${API_ENDPOINTS.CHAT.BASE}?date=${encodeURIComponent(date)}&offset=${offset}&limit=${limit}`,
		);
		if (!response.success) {
			throw new Error(response.message ?? "Failed to fetch chat");
		}
		return {
			messages: response.data?.messages.reverse() ?? [],
			nudge: response.data?.nudge,
		};
	}

	async sendMessage(date: string, message: string): Promise<ChatMessage> {
		const response = await httpClient.post<ApiResponse<ChatMessage>>(
			API_ENDPOINTS.CHAT.BASE,
			{ date, message, recordedAt: new Date().toISOString() },
		);
		if (!response.success) {
			throw new Error(response.message ?? "Failed to send message");
		}

		return response.data!;
	}

	async transcribeAudio(
		audioFile: File | Blob,
	): Promise<TranscribeAudioResponse> {
		const formData = new FormData();
		const file =
			audioFile instanceof File
				? audioFile
				: new File([audioFile], "audio.wav", { type: "audio/wav" });
		formData.append("audio", file);

		const response = await httpClient.post<
			ApiResponse<TranscribeAudioResponse>
		>(API_ENDPOINTS.CHAT.TRANSCRIBE_AUDIO, formData);

		if (!response.success) {
			throw new Error(response.message ?? "Failed to transcribe audio");
		}
		return {
			transcription_text: response.data?.transcription_text ?? "",
		};
	}
}

export const chatService = new ChatService();
