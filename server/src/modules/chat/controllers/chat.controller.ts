import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { ChatService } from "../service/chat.service";
import { BadRequestError } from "../../../shared/errors";
import { handleError } from "../../../shared/middleware/errorHandler";
import { DateManager } from "server/src/shared/utils/utils";

export class ChatController {
	private chatService = new ChatService();

	async getChatByDate(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				throw new BadRequestError("User not authenticated");
			}
			const dateStr = DateManager.parseAndValidateDate(
				(req.query.date as string) ?? "",
			);
			const messages = await this.chatService.getChatByDate(userId, dateStr);
			sendSuccess(res, { messages }, "Chat retrieved successfully");
		} catch (error: unknown) {
			handleError(res, error);
		}
	}

	async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				throw new BadRequestError("User not authenticated");
			}
			const { date: dateStr, message } = req.body as {
				date?: string;
				message?: string;
			};
			const date = DateManager.parseAndValidateDate(dateStr ?? "");
			if (!message || typeof message !== "string") {
				throw new BadRequestError("Message is required");
			}
			const result = await this.chatService.sendMessage(userId, date, message);
			sendSuccess(res, result, "Message sent successfully");
		} catch (error: unknown) {
			handleError(res, error);
		}
	}
}
