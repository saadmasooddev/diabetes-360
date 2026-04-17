import type { FcmRegistrationInput } from "@shared/schema";

const KEY = "d360-fcm-registration";

export function saveFcmRegistration(reg: FcmRegistrationInput): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(reg));
	} catch {
		/* ignore quota / private mode */
	}
}

export function readFcmRegistration(): FcmRegistrationInput | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as FcmRegistrationInput;
		if (
			parsed &&
			typeof parsed.token === "string" &&
			typeof parsed.deviceType === "string"
		) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

export function clearFcmRegistration(): void {
	try {
		localStorage.removeItem(KEY);
	} catch {
		/* ignore */
	}
}
