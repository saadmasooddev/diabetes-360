import * as OpenIdClient from "openid-client";
import { config } from "../../app/config";
import { UnauthorizedError } from "../../shared/errors";

export interface KeycloakUserInfoClaims {
	sub: string;
	email: string;
	givenName: string;
	familyName: string;
}

export class KeyClockOidcService {

	private readonly isConfigured = config.keycloak.isConfigured
	constructor() {
	}
  private getOidcConfiguration() {
		if (!this.isConfigured) {
			throw new Error("Keycloak OIDC is not configured");
		}
		const configurationPromise = OpenIdClient.discovery(
			new URL(config.keycloak.issuerUrl),
			config.keycloak.clientId,
			config.keycloak.clientSecret
		);
		return configurationPromise;
}

async getKeycloakUserInfoFromAccessToken(
	accessToken: string,
	expectedSub: string
): Promise<KeycloakUserInfoClaims> {
	const trimmed = accessToken?.trim();
	if (!trimmed) {
		throw new UnauthorizedError("Invalid SSO token");
	}
		const oidcConfig = await this.getOidcConfiguration();
		const claims = await OpenIdClient.fetchUserInfo(oidcConfig, trimmed, expectedSub);
		const sub = claims.sub;
		const emailRaw = claims.email || "";
		const email = emailRaw.toLowerCase();
		if (!sub || !email) {
			throw new UnauthorizedError(
				"SSO profile must include sub and email. Ensure the email scope is enabled for this client in Keycloak.",
			);
		}
		const givenName = claims.given_name || ""
		const familyName = claims.family_name || claims.name || ""

		return {
			sub,
			email,
			givenName,
			familyName,
		};

}
}

export const keyClockOidcService = new KeyClockOidcService()