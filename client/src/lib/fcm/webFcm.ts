import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import {
	FCM_DEVICE_TYPE_ENUM,
	type FcmRegistrationInput,
} from "@shared/schema";
import {
	getFireBaseCredentials,
	getFirebasePublicConfig,
	isFirebaseMessagingConfigured,
} from "@/config/firebasePublicConfig";

let app: FirebaseApp | null = null;

export function getOrInitApp(): FirebaseApp | null {
	if (!isFirebaseMessagingConfigured()) return null;
	if (app) return app;
	const cfg = getFirebasePublicConfig();
	app = initializeApp(cfg);
	return app;
}

export async function tryGetWebFcmRegistration(): Promise<
	FcmRegistrationInput | undefined
> {

	if (!(await isSupported())) {
		return undefined;
	}
	const firebaseApp = getOrInitApp();
	if (!firebaseApp) return undefined;


	const perm = await Notification.requestPermission();
	if (perm !== "granted") {
		return undefined;
	}

	try {
		const messaging = getMessaging(firebaseApp);
		const token = await getToken(messaging, {
			vapidKey: getFireBaseCredentials().vapidKey,
		});
		if (!token) return undefined;
		return {
			token,
			deviceType: FCM_DEVICE_TYPE_ENUM.WEB,
		};
	} catch {
		return undefined;
	}
}
