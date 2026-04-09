import { getMessaging, type Message } from "firebase-admin/messaging";
import { type PushMessagePayload } from "../models/fcm.schema";
import { FcmTokenRepository } from "../repositories/fcm-token.repository";
import { PushNotificationLogRepository } from "../repositories/push-notification-log.repository";
import { getFirebaseApp } from "server/src/app/config/firebase";

export class PushNotificationService {
	private readonly fcmRepo: FcmTokenRepository;
	private readonly logRepo: PushNotificationLogRepository;

	constructor(
		fcmRepo = new FcmTokenRepository(),
		logRepo = new PushNotificationLogRepository(),
	) {
		this.fcmRepo = fcmRepo;
		this.logRepo = logRepo;
	}

	private readonly DATA_ONLY_PLATFORM_OPTIONS: Pick<
		Message,
		"android" | "apns" | "webpush"
	> = {
		android: { priority: "high" },
		apns: {
			payload: {
				aps: {
					"content-available": true,
				},
			},
		},
	};

	private buildDataStrings(
		payload: PushMessagePayload,
	): Record<string, string> {
		const base = {
			title: payload.title,
			body: payload.body,
			type: payload.type,
		};
		return {
			...base,
			payload: JSON.stringify(payload.data),
		};
	}

	async sendDataOnlyToUser(
		userId: string,
		payload: PushMessagePayload,
	): Promise<void> {
		const app = getFirebaseApp();
		if (!app) {
			return;
		}
		const messaging = getMessaging(app);

		const tokens = await this.fcmRepo.listByUserId(userId);
		if (tokens.length === 0) {
			return;
		}

		const data = this.buildDataStrings(payload);
		const payloadRecord = { ...payload.data, type: payload.type };

		await this.logRepo.insert({
			userId,
			title: payload.title,
			body: payload.body,
			messageType: payload.type,
			payload: payloadRecord,
		});

		const messages: Message[] = tokens.map((row) => ({
			token: row.token,
			data,
			...this.DATA_ONLY_PLATFORM_OPTIONS,
		}));

		const result = await messaging.sendEach(messages);
		if (result.failureCount > 0) {
			console.warn(
				`[PushNotificationService] ${result.failureCount}/${messages.length} FCM deliveries failed for user ${userId}`,
			);
		}
	}
}
