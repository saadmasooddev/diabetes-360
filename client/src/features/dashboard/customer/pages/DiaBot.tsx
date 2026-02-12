import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useChatByDate,
	useSendChatMessage,
} from "@/hooks/mutations/useChat";
import { DateManager } from "@/lib/utils";
import { Markdown } from "markdown-to-jsx/react";

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
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const todayStr = DateManager.formatDate(new Date());
	const { data, isLoading, isError } = useChatByDate(todayStr);
	const sendMessage = useSendChatMessage(todayStr);

	const messages = data?.messages ?? [];
	const isSending = sendMessage.isPending;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages.length, isSending]);

	const handleSendMessage = () => {
		const trimmed = inputValue.trim();
		if (!trimmed || isSending) return;

		setInputValue("");
		sendMessage.mutate(trimmed);
	};

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
					className="w-full max-w-[1200px] mx-auto flex flex-col"
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
								disabled={isLoading || isSending}
								data-testid="input-message"
							/>

							<Button
								onClick={handleSendMessage}
								disabled={!inputValue.trim() || isLoading || isSending}
								variant="ghost"
								size="icon"
								className="flex-shrink-0"
								style={{
									color:
										inputValue.trim() && !isSending ? "#00856F" : "#B0BEC5",
								}}
								aria-label="Send message"
								data-testid="button-send"
							>
								<Send size={20} />
							</Button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
