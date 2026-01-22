import type { TokenPair } from "@/types/auth.types";

class TokenManager {
	private static readonly ACCESS_TOKEN_KEY = "access_token";
	private static readonly REFRESH_TOKEN_KEY = "refresh_token";

	static setTokens(tokens: TokenPair): void {
		localStorage.setItem(TokenManager.ACCESS_TOKEN_KEY, tokens.accessToken);
		localStorage.setItem(TokenManager.REFRESH_TOKEN_KEY, tokens.refreshToken);
	}

	static getAccessToken(): string | null {
		return localStorage.getItem(TokenManager.ACCESS_TOKEN_KEY);
	}

	static getRefreshToken(): string | null {
		return localStorage.getItem(TokenManager.REFRESH_TOKEN_KEY);
	}

	static getTokens(): TokenPair | null {
		const accessToken = TokenManager.getAccessToken();
		const refreshToken = TokenManager.getRefreshToken();
		if (!accessToken || !refreshToken) return null;
		return {
			accessToken,
			refreshToken,
		};
	}

	static clearTokens(): void {
		localStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
		localStorage.removeItem(TokenManager.REFRESH_TOKEN_KEY);
	}

	static hasTokens(): boolean {
		return !!(TokenManager.getAccessToken() && TokenManager.getRefreshToken());
	}

	static getAuthHeader(): string | null {
		const token = TokenManager.getAccessToken();
		return token ? `Bearer ${token}` : null;
	}
}

export { TokenManager };
