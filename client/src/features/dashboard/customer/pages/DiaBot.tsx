import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useInView } from "react-intersection-observer"
import { Send, Mic, Square } from "lucide-react";
import {
	IMediaRecorder,
	MediaRecorder,
} from "extendable-media-recorder";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useChatByDate,
	useSendChatMessage,
	useTranscribeAudio,
} from "@/hooks/mutations/useChat";
import { DateManager, generalUtils } from "@/lib/utils";
import { Markdown } from "markdown-to-jsx/react";
import { useToast } from "@/hooks/use-toast";

function formatTime(iso: string): string {
	const d = new Date(iso);
	const hours = d.getHours();
	const minutes = d.getMinutes();
	const ampm = hours >= 12 ? "PM" : "AM";
	const h = hours % 12 || 12;
	const m = minutes < 10 ? `0${minutes}` : minutes;
	return `${h}:${m} ${ampm}`;
}


export default function DiaBot() {
	const [inputValue, setInputValue] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const streamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const mediaRecorderRef = useRef<IMediaRecorder | null>(null);

	const todayStr = DateManager.formatDate(new Date());
	const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, } =
		useChatByDate(todayStr);
	const sendMessage = useSendChatMessage(todayStr);
	const transcribeAudio = useTranscribeAudio();
	const { toast } = useToast();
	const { ref: intersectionRef, inView, entry } = useInView({
		threshold: 0.2
	})
	const previousScrollHeightRef = useRef(0);

	const messages = data?.pages.map(page => page.messages).flat() || []
	const nudge = data?.pages[0]?.nudge;
	const isSending = sendMessage.isPending;
	const isTranscribing = transcribeAudio.isPending;
	const canSendText = Boolean(inputValue.trim()) && !isSending && !isTranscribing;
	const canSend = canSendText;

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			const element = chatContainerRef.current
			previousScrollHeightRef.current = element?.scrollHeight || 0
			fetchNextPage()
		}
	}, [inView, hasNextPage, isFetchingNextPage])


	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [isSending, isTranscribing]);

	useLayoutEffect(() => {
		const element = chatContainerRef.current
		if (element) {
			const newScrollHeight = chatContainerRef.current.scrollHeight;
			const heightDifference = newScrollHeight - previousScrollHeightRef.current;
			chatContainerRef.current.scrollTop += heightDifference;
		}

		previousScrollHeightRef.current = chatContainerRef.current?.scrollHeight || 0;
	}, [messages.length])

	const stopStream = useCallback(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}, []);

	const startRecording = useCallback(async () => {
		try {
			await generalUtils.ensureWavEncoderRegistered();

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			streamRef.current = stream;
			chunksRef.current = [];
			const mimeType = "audio/wav";

			const recorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = recorder;
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};
			recorder.onstop = async () => {
				mediaRecorderRef.current = null;
				setIsRecording(false);
				stopStream();

				const blob = new Blob(chunksRef.current, { type: mimeType });

				transcribeAudio.mutate(blob, {
					onSuccess: (result) => {
						const text = result.transcription_text?.trim();
						if (!text) {
							toast({
								title: "No speech detected",
								description: "Try recording again or type your message.",
								variant: "destructive",
							});
							return
						}
						sendMessage.mutate(text);
					},
				});

			};
			recorder.start();
			setIsRecording(true);
		} catch (err) {
			console.log(err)
			toast({
				title: "Microphone access needed",
				description: "Allow microphone access to record voice messages.",
				variant: "destructive",
			});
		}
	}, [stopStream, toast]);

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		setIsRecording(false);
	}, []);

	useEffect(() => {
		return () => {
			stopStream();
		};
	}, [stopStream]);

	const handleSendMessage = () => {
		if (isSending || isTranscribing) return;

		const trimmed = inputValue.trim();
		if (!trimmed) return;

		setInputValue("");
		sendMessage.mutate(trimmed);
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
				<div
					className="w-full max-w-full mx-auto flex flex-col"
					style={{ height: "calc(100vh - 4rem)" }}
				>
					{/* Header */}
					<div
						className="flex items-center justify-between px-8 py-4 mb-6"
						style={{
							background: "#FFFFFF",
							borderRadius: "50px",
							border: "2px solid rgba(0, 133, 111, 0.3)",
						}}
						data-testid="header-diabot"
					>
						<h1
							style={{
								fontSize: "24px",
								fontWeight: 700,
								color: "#00856F",
							}}
							data-testid="text-diabot-title"
						>
							DiaBot
						</h1>
						<div
							className="flex items-center gap-2"
							data-testid="status-online"
						>
							<div
								style={{
									width: "10px",
									height: "10px",
									borderRadius: "50%",
									background: "#00856F",
								}}
							/>
							<span
								style={{
									fontSize: "16px",
									fontWeight: 600,
									color: "#00856F",
								}}
							>
								Online
							</span>
						</div>
					</div>

					{/* Chat Messages Container */}
					<div
						ref={chatContainerRef}
						className="flex-1 overflow-y-auto pb-4 min-h-0"
						style={{ scrollBehavior: "smooth" }}
						data-testid="container-chat-messages"
					>
						{isLoading ? (
							<div className="flex items-center justify-center h-32">
								<div className="animate-pulse text-[#00856F] font-medium">
									Loading chat...
								</div>
							</div>
						) : isError ? (
							<div className="flex items-center justify-center h-32 text-red-600">
								Failed to load chat. Please refresh.
							</div>
						) : (
							<div className="space-y-4">
								<div ref={intersectionRef}></div>
								{nudge && (
									<div
										className="flex justify-end"
										data-testid="message-nudge-assistant"
									>
										<div className="flex flex-col items-end gap-1 max-w-[70%]">
											<div
												style={{
													background: "#00856F",
													borderRadius: "12px",
													padding: "12px 16px",
													fontSize: "14px",
													fontWeight: 400,
													color: "#FFFFFF",
												}}
												data-testid="text-message-nudge"
											>
												<Markdown>{nudge}</Markdown>
											</div>
										</div>
									</div>
								)}
								{messages.map((msg) => (
									<div
										key={msg.id}
										className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
										data-testid={`message-${msg.role}-${msg.id}`}
									>
										{msg.role === "user" && (
											<div className="flex gap-3 max-w-[70%]">
												<div
													className="flex-shrink-0"
													style={{
														width: "36px",
														height: "36px",
														borderRadius: "50%",
														background: "#E0E0E0",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontSize: "14px",
														fontWeight: 600,
														color: "#546E7A",
													}}
													data-testid={`avatar-user-${msg.id}`}
												>
													U
												</div>
												<div className="flex flex-col gap-1">
													<div
														style={{
															fontSize: "14px",
															fontWeight: 600,
															color: "#00453A",
														}}
													>
														You
													</div>
													<div
														style={{
															background: "#FFFFFF",
															borderRadius: "12px",
															padding: "12px 16px",
															fontSize: "14px",
															fontWeight: 400,
															color: "#263238",
															border: "1px solid rgba(0, 0, 0, 0.1)",
														}}
														data-testid={`text-message-${msg.id}`}
													>
														{msg.message}
													</div>
													<div
														style={{
															fontSize: "12px",
															fontWeight: 400,
															color: "#90A4AE",
														}}
														data-testid={`text-timestamp-${msg.id}`}
													>
														{formatTime(msg.recordedAt)}
													</div>
												</div>
											</div>
										)}

										{msg.role === "assistant" && (
											<div className="flex flex-col items-end gap-1 max-w-[70%]">
												<div
													style={{
														background: "#00856F",
														borderRadius: "12px",
														padding: "12px 16px",
														fontSize: "14px",
														fontWeight: 400,
														color: "#FFFFFF",
													}}
													data-testid={`text-message-${msg.id}`}
												>
													<Markdown>{msg.message}</Markdown>
												</div>
												<div
													className="flex items-center gap-1"
													style={{
														fontSize: "12px",
														fontWeight: 400,
														color: "#90A4AE",
													}}
													data-testid={`text-timestamp-${msg.id}`}
												>
													{formatTime(msg.recordedAt)}
												</div>
											</div>
										)}
									</div>
								))}

								{isSending && (
									<div
										className="flex justify-end"
										data-testid="indicator-typing"
									>
										<div
											style={{
												background: "#00856F",
												borderRadius: "12px",
												padding: "12px 16px",
												fontSize: "14px",
												fontWeight: 400,
												color: "#FFFFFF",
											}}
										>
											<div className="flex gap-1">
												<div
													className="w-2 h-2 rounded-full bg-white animate-bounce"
													style={{ animationDelay: "0ms" }}
												/>
												<div
													className="w-2 h-2 rounded-full bg-white animate-bounce"
													style={{ animationDelay: "150ms" }}
												/>
												<div
													className="w-2 h-2 rounded-full bg-white animate-bounce"
													style={{ animationDelay: "300ms" }}
												/>
											</div>
										</div>
									</div>
								)}

								{isTranscribing && (
									<div
										className="flex justify-start"
										data-testid="indicator-transcribing"
									>
										<div
											className="flex items-center gap-2 px-4 py-2 rounded-full"
											style={{
												background: "rgba(0, 133, 111, 0.12)",
												border: "1px solid rgba(0, 133, 111, 0.3)",
											}}
										>
											<div className="flex gap-1">
												<div
													className="w-2 h-2 rounded-full bg-[#00856F] animate-bounce"
													style={{ animationDelay: "0ms" }}
												/>
												<div
													className="w-2 h-2 rounded-full bg-[#00856F] animate-bounce"
													style={{ animationDelay: "150ms" }}
												/>
												<div
													className="w-2 h-2 rounded-full bg-[#00856F] animate-bounce"
													style={{ animationDelay: "300ms" }}
												/>
											</div>
											<span
												className="text-sm font-medium"
												style={{ color: "#00453A" }}
											>
												Transcribing your voice...
											</span>
										</div>
									</div>
								)}

								<div ref={messagesEndRef} />
							</div>
						)}
					</div>

					{/* Input Area */}
					<div className="py-4 flex-shrink-0">
						<div
							className="flex items-center gap-3 px-4 py-3"
							style={{
								background: "#FFFFFF",
								borderRadius: "12px",
								border: "1px solid rgba(0, 0, 0, 0.1)",
							}}
							data-testid="container-input"
						>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="flex-shrink-0"
								onClick={isRecording ? stopRecording : startRecording}
								disabled={isLoading || isSending || isTranscribing}
								style={{
									color: isRecording ? "#C62828" : "#00856F",
									background: isRecording
										? "rgba(198, 40, 40, 0.1)"
										: "transparent",
								}}
								aria-label={isRecording ? "Stop recording" : "Start voice recording"}
								data-testid="button-mic"
							>
								{isRecording ? (
									<Square size={20} fill="currentColor" />
								) : (
									<Mic size={20} />
								)}
							</Button>
							<Input
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyPress}
								placeholder="Ask me anything about diabetes..."
								className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
								style={{
									fontSize: "14px",
									fontWeight: 400,
									color: "#263238",
								}}
								disabled={isLoading || isSending || isRecording || isTranscribing}
								data-testid="input-message"
							/>

							<Button
								onClick={handleSendMessage}
								disabled={!canSend}
								variant="ghost"
								size="icon"
								className="flex-shrink-0"
								style={{
									color: canSend ? "#00856F" : "#B0BEC5",
								}}
								aria-label="Send message"
								data-testid="button-send"
							>
								<Send size={20} />
							</Button>
							{/* <Button
								onClick={() => fetchNextPage()}
								disabled={!hasNextPage || isFetchingNextPage}
							>
								Load More
							</Button> */}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
