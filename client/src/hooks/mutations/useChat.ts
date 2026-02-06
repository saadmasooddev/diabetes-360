import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "@/services/chatService";
import type {
	ChatMessageDto,
	GetChatResponse,
	SendMessageResponse,
} from "@/services/chatService";
import { API_ENDPOINTS } from "@/config/endpoints";
import { CHAT_ROLES } from "@shared/schema";

function chatQueryKey(date: string) {
	return [API_ENDPOINTS.CHAT.BASE, "date", date] as const;
}

export function useChatByDate(date: string | null) {
	return useQuery<GetChatResponse>({
		queryKey: chatQueryKey(date ?? ""),
		queryFn: () => chatService.getChatByDate(date!),
		enabled: !!date,
	});
}

export function useSendChatMessage(date: string | null) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation<
		SendMessageResponse,
		Error,
		string,
		{ prev?: GetChatResponse }
	>({
		mutationFn: (message: string) =>
			chatService.sendMessage(date!, message.trim()),
		onMutate: async (variables): Promise<{ prev?: GetChatResponse }> => {
			if (!date) return {};
			await queryClient.cancelQueries({ queryKey: chatQueryKey(date) });
			const prev = queryClient.getQueryData<GetChatResponse>(
				chatQueryKey(date),
			);
			const userMsg: ChatMessageDto = {
				id: `temp-user-${Date.now()}`,
				recordedAt: new Date().toISOString(),
				chatDate: date,
				userId: "",
				role: CHAT_ROLES.USER,
				message: variables.trim(),
			};
			queryClient.setQueryData<GetChatResponse>(chatQueryKey(date), {
				messages: [...(prev?.messages ?? []), userMsg],
			});
			return { prev };
		},
		onSuccess: (data: SendMessageResponse, _variables, _context) => {
			if (!date) return;
			queryClient.setQueryData<GetChatResponse>(chatQueryKey(date), (prev) => {
				if (!prev) return prev;
				const assistantMsg: ChatMessageDto = {
					id: `temp-assistant-${Date.now()}`,
					recordedAt: new Date().toISOString(),
					chatDate: date,
					userId: "",
					role: CHAT_ROLES.ASSISTANT,
					message: data.assistantMessage,
				};
				return {
					messages: [...prev.messages, assistantMsg],
				};
			});
		},
		onError: (error: Error, _variables, context) => {
			if (date && context?.prev !== undefined) {
				queryClient.setQueryData(chatQueryKey(date), context.prev);
			}
			toast({
				title: "Failed to send message",
				description: error.message ?? "Please try again.",
				variant: "destructive",
			});
		},
	});
}
