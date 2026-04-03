import {
	cert,
	initializeApp,
	type App,
	ServiceAccount,
} from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";
import { config } from "../../../app/config";
import { type PushMessagePayload, PUSH_MESSAGE_TYPE_ENUM, FCM_DEVICE_TYPE_ENUM, FcmDeviceType } from "../models/fcm.schema";
import { FcmTokenRepository } from "../repositories/fcm-token.repository";
import { PushNotificationLogRepository } from "../repositories/push-notification-log.repository";



let firebaseApp: App | null | undefined;

function getFirebaseApp(): App | null {
	if (firebaseApp !== undefined) return firebaseApp;
	try {
		const privateKey = JSON.parse(config.firebase.adminSdkPrivateKey) as ServiceAccount
		firebaseApp = initializeApp({
			credential: cert(privateKey),
		});
		return firebaseApp;
	} catch (e) {
		console.error("[PushNotificationService] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", e);
		firebaseApp = null;
		return null;
	}
}

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

 private readonly DATA_ONLY_PLATFORM_OPTIONS: Pick<Message, "android" | "apns" | "webpush"> = {
	android: { priority: "high" },
	apns: {
		payload: {
			aps: {
				"content-available": 1,
			},
		},
	},
	webpush: {
		headers: {
			Urgency: "high",
		},
	},
};


 private buildDataStrings(payload: PushMessagePayload): Record<string, string> {
	const base = {
		title: payload.title,
		body: payload.body,
		type: payload.type,
	};
	if (payload.type === PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT) {
		return {
			...base,
			payload: JSON.stringify(payload.data),
		};
	}
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

		const tokens = await this.fcmRepo.listByUserId(userId);
		if (tokens.length === 0) {
			return;
		}

		const data = this.buildDataStrings(payload);
		const payloadRecord = { ...payload.data, type: payload.type }

		await this.logRepo.insert({
			userId,
			title: payload.title,
			body: payload.body,
			messageType: payload.type,
			payload: payloadRecord ,
		});

		const messaging = getMessaging(app);
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
