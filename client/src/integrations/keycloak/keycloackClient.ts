import Keycloak from "keycloak-js";
import { ROUTES } from "@/config/routes";

let instance: Keycloak | null = null;

export function isKeycloakSsoConfigured(): boolean {
	const url = import.meta.env.VITE_KEYCLOAK_URL?.trim() || "https://keycloak-app-acdpe5bkgnbjcacs.southeastasia-01.azurewebsites.net";
	const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim() || "mycompany-sso";
	const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || "echo360-dev";
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