export type FirebasePublicConfig = {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
};

export function getFireBaseCredentials() {
	return {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
		storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
		messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
		appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
		vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
	};
}
export function getFirebasePublicConfig(): FirebasePublicConfig {
	const { vapidKey, ...publicConfig } = getFireBaseCredentials();
	return publicConfig;
}

export function isFirebaseMessagingConfigured(): boolean {
	const c = getFireBaseCredentials();
	return Boolean(
		c.apiKey && c.projectId && c.messagingSenderId && c.appId && c.vapidKey,
	);
}
