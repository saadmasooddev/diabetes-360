import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "@/services/chatService";
import type {
	ChatMessageDto,
	GetChatResponse,
	TranscribeAudioResponse,
} from "@/services/chatService";
import { API_ENDPOINTS } from "@/config/endpoints";
import { CHAT_ROLES, ChatMessage } from "@shared/schema";

type ChatInfiniteData = InfiniteData<GetChatResponse, unknown> | undefined

function chatQueryKey(date: string) {
	return [API_ENDPOINTS.CHAT.BASE, "date", date] as const;
}

const CHAT_LIMIT = 5

export function useChatByDate(date: string) {
	return useInfiniteQuery<GetChatResponse>({
		queryKey: chatQueryKey(date),
		queryFn: ({ pageParam = 0 }) =>  chatService.getChatByDate(date, { offset: pageParam, limit: CHAT_LIMIT }),
		initialPageParam: 0,
		getNextPageParam: (lastPage , allPages) => {
			if(lastPage.messages?.length  === 0) return undefined
			return allPages.length * CHAT_LIMIT
		},
		select: (data) =>  {
			return {
				pages: [...data.pages].reverse(),
				pageParams: [...data.pageParams].reverse(),
			}
		},
		enabled: !!date,
	})
}

export function useSendChatMessage(date: string) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation<
		ChatMessage,
		Error,
		string,
		{ prev?: ChatInfiniteData }
	>({
		mutationFn: (message: string) =>
			chatService.sendMessage(date!, message.trim()),
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: chatQueryKey(date) });
			const prev = queryClient.getQueryData<ChatInfiniteData>(
				chatQueryKey(date),
			);
			const id =  `temp-user-${Date.now()}`
			const userMsg: ChatMessageDto = {
				id ,
				recordedAt: new Date().toISOString(),
				chatDate: date,
				userId: "",
				role: CHAT_ROLES.USER,
				message: variables.trim(),
			};
			if(!prev || prev.pages.length === 0) return { prev }

			queryClient.setQueryData<ChatInfiniteData>(chatQueryKey(date), {
				...prev,
				pages: prev.pages.map((page, index)=> {
				  if(index === 0){
						return {
							...page,
							messages: page.messages.concat(userMsg)
						}
					}	
					return page
				})
			});
		  return { prev }
		},
		onSuccess: (data: ChatMessage, _variables, _context) => {
			if (!date) return;
			queryClient.setQueryData<ChatInfiniteData>(chatQueryKey(date), (prev) => {
				if (!prev || prev.pages.length === 0) return prev;
				const assistantMsg: ChatMessageDto = {
					...data,
					recordedAt: new Date(data.recordedAt).toISOString(),
					role: data.role as CHAT_ROLES
				};
				prev.pages[0].messages.push(assistantMsg)
				return prev;
			});
		},
		onError: (error: Error, _variables, context ) => {
			if (date && context?.prev !== undefined) {
				queryClient.setQueryData<ChatInfiniteData>(chatQueryKey(date), context.prev);
			}
			toast({
				title: "Failed to send message",
				description: error.message ?? "Please try again.",
				variant: "destructive",
			});
		},
	});
}

export function useTranscribeAudio() {
	const { toast } = useToast();

	return useMutation<TranscribeAudioResponse, Error, File | Blob>({
		mutationFn: (audio: File | Blob) => chatService.transcribeAudio(audio),
		onError: (error: Error) => {
			toast({
				title: "Transcription failed",
				description: error.message ?? "Please try again with a WAV recording.",
				variant: "destructive",
			});
		},
	});
}
