import { AuthenticatedRequest } from "server/src/shared/middleware/auth";
import { NotificationsService } from "../services/notifications.service";
import { fcmRegistrationSchema } from "@shared/schema";
import { ValidationError } from "server/src/shared/errors";
import { handleError } from "server/src/shared/middleware/errorHandler";
import { sendSuccess } from "server/src/app/utils/response";
import { Response } from "express";

export class NotificationsController {
	private readonly notificationsService = new NotificationsService();

	async storeFcmToken(req: AuthenticatedRequest, res: Response) {
		try {
			const fcm = fcmRegistrationSchema.safeParse(req.body);
			if (!fcm.success) {
				throw new ValidationError(undefined, fcm.error);
			}
			await this.notificationsService.storeFcmToken(
				req.user?.userId!,
				fcm.data,
			);
			sendSuccess(res, undefined, "FCM token stored successfully");
		} catch (error) {
			handleError(res, error);
		}
	}
}
