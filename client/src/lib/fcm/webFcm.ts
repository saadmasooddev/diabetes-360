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
	if (getApps().length > 0) {
		app = getApps()[0]!;
		return app;
	}
	const cfg = getFirebasePublicConfig();
	app = initializeApp(cfg);
	return app;
}

export async function tryGetWebFcmRegistration(): Promise<
	FcmRegistrationInput | undefined
> {
	try {
		if (!(await isSupported())) {
			throw new Error("FCM is not supported");
		}
		const firebaseApp = getOrInitApp();
		if (!firebaseApp) throw new Error("Firebase app is not initialized");

		const perm = await Notification.requestPermission();
		if (perm !== "granted") {
			throw new Error("Notifications permission not granted");
		}

		const registration = await navigator.serviceWorker.register(
			"/firebase-messaging-sw.js",
		);
		await registration.update();
		await navigator.serviceWorker.ready;
		const messaging = getMessaging(firebaseApp);
		const token = await getToken(messaging, {
			vapidKey: getFireBaseCredentials().vapidKey,
			serviceWorkerRegistration: registration,
		});
		if (!token) throw new Error("FCM token not found");
		return {
			token,
			deviceType: FCM_DEVICE_TYPE_ENUM.WEB,
		};
	} catch (e) {
		console.error("[webFcm] getToken failed:", e);
		return undefined;
	}
}

/**
 * Registers the FCM service worker (classic) and refreshes the push token so
 * `onMessage` receives foreground data messages. Call when the user is already
 * signed in and notification permission is granted (e.g. from FcmForegroundListener).
 */
export async function ensureForegroundMessagingReady(): Promise<boolean> {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
		return false;
	}
	if (!(await isSupported())) {
		return false;
	}
	if (!isFirebaseMessagingConfigured()) {
		return false;
	}
	if (Notification.permission !== "granted") {
		return false;
	}
	const firebaseApp = getOrInitApp();
	if (!firebaseApp) {
		return false;
	}
	try {
		const registration = await navigator.serviceWorker.register(
			"/firebase-messaging-sw.js",
		);
		await navigator.serviceWorker.ready;
		const messaging = getMessaging(firebaseApp);
		await getToken(messaging, {
			vapidKey: getFireBaseCredentials().vapidKey,
			serviceWorkerRegistration: registration,
		});
		return true;
	} catch (e) {
		console.error("[webFcm] ensureForegroundMessagingReady failed:", e);
		return false;
	}
}
