import Keycloak from "keycloak-js";
import { ROUTES } from "@/config/routes";

let instance: Keycloak | null = null;

export function isKeycloakSsoConfigured(): boolean {
	const url = import.meta.env.VITE_KEYCLOAK_URL?.trim()
	const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim()
	const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() 
	return Boolean(url && realm && clientId);
}

export function getKeycloakInstance(): Keycloak | null {
	if (!isKeycloakSsoConfigured()) {
		return null
	}
	if (!instance) {
		instance = new Keycloak({
			url: import.meta.env.VITE_KEYCLOAK_URL as string,
			realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
			clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
		});
	}
	return instance;
}

export function getSsoLoginRedirectUri(): string {
	return `${window.location.origin}${ROUTES.LOGIN}`;
}

export function redirectToKeycloakLogin(): void {
	const kc = getKeycloakInstance();
	if(kc)
		kc.login({ redirectUri: getSsoLoginRedirectUri() });
}
