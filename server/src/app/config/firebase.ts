import { App, cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { config } from ".";

let firebaseApp: App | null | undefined;

export function getFirebaseApp(): App | null {
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