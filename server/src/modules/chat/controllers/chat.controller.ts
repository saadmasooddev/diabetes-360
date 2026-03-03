import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { ChatService } from "../service/chat.service";
import { BadRequestError } from "../../../shared/errors";
import { handleError } from "../../../shared/middleware/errorHandler";
import { DateManager, validateLimitAndOffset } from "server/src/shared/utils/utils";

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
			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: undefined;
			const skip = parseInt(req.query.skip as string, 10);
			const offset = req.query.offset
				? parseInt(req.query.offset as string)
				: skip 
				  ? skip 
					: undefined;
			validateLimitAndOffset(limit, offset)
			const { messages, nudge } = await this.chatService.getChat(
				userId,
				dateStr,
				offset,
				limit
			);
			sendSuccess(res, { messages, nudge: nudge || null }, "Chat retrieved successfully");
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
			const {
				date: dateStr,
				message,
				recordedAt,
			} = req.body as {
				date?: string;
				message?: string;
				recordedAt?: string;
			};
			if (!dateStr || !message || !recordedAt) {
				throw new BadRequestError("Date, message and recordedAt are required");
			}
			if (
				isNaN(new Date(dateStr).getTime()) ||
				isNaN(new Date(recordedAt).getTime())
			) {
				throw new BadRequestError("Invalid date format");
			}

			const result = await this.chatService.sendMessage(
				userId,
				dateStr,
				message,
				recordedAt,
			);
			sendSuccess(res, result, "Message sent successfully");
		} catch (error: unknown) {
			handleError(res, error);
		}
	}

	async transcribeAudio(
		req: AuthenticatedRequest & { file?: Express.Multer.File },
		res: Response,
	): Promise<void> {
		try {
			if (!req.file?.buffer) {
				throw new BadRequestError("Audio file is required (WAV format)");
			}
			const result = await this.chatService.transcribeAudio(req.file.buffer);
			sendSuccess(res, result, "Transcription completed successfully");
		} catch (error: unknown) {
			handleError(res, error);
		}
	}
}
