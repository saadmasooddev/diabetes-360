import Keycloak from "keycloak-js";
import { ROUTES } from "@/config/routes";

const DEFAULT_KEYCLOAK_URL =
	"https://keycloak-app-acdpe5bkgnbjcacs.southeastasia-01.azurewebsites.net";
const DEFAULT_KEYCLOAK_REALM = "mycompany-sso";
const DEFAULT_KEYCLOAK_CLIENT_ID = "echo360-dev";

export type KeycloakPublicConfig = {
	url: string;
	realm: string;
	clientId: string;
};

export function resolveKeycloakPublicConfig(): KeycloakPublicConfig | null {
	const url =
		import.meta.env.VITE_KEYCLOAK_URL?.trim() || DEFAULT_KEYCLOAK_URL;
	const realm =
		import.meta.env.VITE_KEYCLOAK_REALM?.trim() || DEFAULT_KEYCLOAK_REALM;
	const clientId =
		import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() ||
		DEFAULT_KEYCLOAK_CLIENT_ID;
	if (!url || !realm || !clientId) {
		return null;
	}
	return { url, realm, clientId };
}

let instance: Keycloak | null = null;
let instanceConfigKey: string | null = null;

function configKey(cfg: KeycloakPublicConfig): string {
	return `${cfg.url}|${cfg.realm}|${cfg.clientId}`;
}

export function isKeycloakSsoConfigured(): boolean {
	return resolveKeycloakPublicConfig() !== null;
}

export function getKeycloakInstance(): Keycloak | null {
	const cfg = resolveKeycloakPublicConfig();
	if (!cfg) {
		return null;
	}
	const key = configKey(cfg);
	if (instance && instanceConfigKey === key) {
		return instance;
	}
	instance = new Keycloak({
		url: cfg.url,
		realm: cfg.realm,
		clientId: cfg.clientId,
	});
	instanceConfigKey = key;
	return instance;
}

export function getSsoLoginRedirectUri(): string {
	return `${window.location.origin}${ROUTES.LOGIN}`;
}

/** Ensures a single `init()` per page load (Strict Mode / remount safe). */
let initCheckSsoPromise: Promise<boolean> | null = null;

export function initKeycloakCheckSso(): Promise<boolean> | null {
	const kc = getKeycloakInstance();
	if (!kc) {
		return null;
	}
	if (!initCheckSsoPromise) {
		initCheckSsoPromise = kc
			.init({
				onLoad: "check-sso",
				pkceMethod: "S256",
			})
			.catch((err: unknown) => {
				initCheckSsoPromise = null;
				throw err;
			});
	}
	return initCheckSsoPromise;
}

export function redirectToKeycloakLogin(): void {
	const kc = getKeycloakInstance();
	if (kc) {
		kc.login({ redirectUri: getSsoLoginRedirectUri() });
	}
}
