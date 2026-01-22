import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialChatMessages, botResponses, type ChatMessage } from "@/mocks/diabot";

export default function DiaBot() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
	const [inputValue, setInputValue] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		scrollToBottom();
	}, []);

	const getCurrentTime = () => {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		const ampm = hours >= 12 ? "PM" : "AM";
		const formattedHours = hours % 12 || 12;
		const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
		return `${formattedHours}:${formattedMinutes} ${ampm}`;
	};

	const handleSendMessage = () => {
		if (!inputValue.trim()) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			sender: "user",
			message: inputValue,
			timestamp: getCurrentTime(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsTyping(true);

		setTimeout(() => {
			const randomResponse =
				botResponses[Math.floor(Math.random() * botResponses.length)];
			const botMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				sender: "bot",
				message: randomResponse,
				timestamp: getCurrentTime(),
			};

			setMessages((prev) => [...prev, botMessage]);
			setIsTyping(false);
		}, 1500);
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
						className="flex-1 overflow-y-auto pb-4"
						style={{
							scrollBehavior: "smooth",
						}}
						data-testid="container-chat-messages"
					>
						<div className="space-y-4">
							{messages.map((msg) => (
								<div
									key={msg.id}
									className={`flex ${msg.sender === "bot" ? "justify-end" : "justify-start"}`}
									data-testid={`message-${msg.sender}-${msg.id}`}
								>
									{msg.sender === "user" && (
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
													User
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
													{msg.timestamp}
												</div>
											</div>
										</div>
									)}

									{msg.sender === "bot" && (
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
												{msg.message}
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
												{msg.timestamp}
												<svg
													width="16"
													height="16"
													viewBox="0 0 16 16"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M13.3333 4L6 11.3333L2.66667 8"
														stroke="#00856F"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
													<path
														d="M13.3333 4L6 11.3333L2.66667 8"
														stroke="#00856F"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
														transform="translate(2, 0)"
													/>
												</svg>
											</div>
										</div>
									)}
								</div>
							))}

							{isTyping && (
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
					</div>

					{/* Input Area */}
					<div className="py-4">
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
								onKeyPress={handleKeyPress}
								placeholder="Start typing..."
								className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
								style={{
									fontSize: "14px",
									fontWeight: 400,
									color: "#263238",
								}}
								data-testid="input-message"
							/>

							<Button
								onClick={handleSendMessage}
								disabled={!inputValue.trim()}
								variant="ghost"
								size="icon"
								className="flex-shrink-0"
								style={{
									color: inputValue.trim() ? "#00856F" : "#B0BEC5",
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
