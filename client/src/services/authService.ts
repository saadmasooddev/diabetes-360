import { API_ENDPOINTS } from "@/config/endpoints";
import { httpClient } from "@/utils/httpClient";
import type {
	SignupRequest,
	SignupRes,
	LoginRequest,
	AuthApiResponse,
	RefreshTokenRequest,
	LogoutRequest,
	RefreshTokenResponse,
	LogoutResponse,
	ForgotPasswordResponse,
	AuthData,
	RefreshTokenData,
	ApiResponse,
} from "@/types/auth.types";
import type { FcmRegistrationInput } from "@shared/schema";

class AuthService {
	async signup(data: SignupRequest): Promise<{ otpSent: boolean }> {
		const response = await httpClient.post<SignupRes>(
			API_ENDPOINTS.AUTH.SIGNUP,
			data,
		);
		if (!response.success) {
			throw new Error(response.message || "Signup failed");
		}
		return {
			otpSent: response.data?.emailVerificationCodeSent ?? false,
		};
	}

	async verifyEmail(email: string, code: string): Promise<string> {
		const response = await httpClient.post<ForgotPasswordResponse>(
			API_ENDPOINTS.AUTH.VERIFY_EMAIL,
			{ email, code },
		);
		if (!response.success) {
			throw new Error(response.message || "Verification failed");
		}
		return response.message ?? "Email verified successfully.";
	}

	async resendVerificationOtp(email: string) {
		const response = await httpClient.post<SignupRes>(
			API_ENDPOINTS.AUTH.RESEND_VERIFICATION_OTP,
			{ email },
		);
		if (!response.success) {
			throw new Error(response.message || "Failed to resend code");
		}
		return {
			otpSent: response.data?.emailVerificationCodeSent ?? false,
		};
	}

	async login(data: LoginRequest): Promise<AuthData> {
		const response = await httpClient.post<AuthApiResponse>(
			API_ENDPOINTS.AUTH.LOGIN,
			data,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Login failed");
		}
		return response.data;
	}

	async requestSignInCode(email: string): Promise<AuthData> {
		const response = await httpClient.post<ApiResponse<AuthData>>(
			API_ENDPOINTS.AUTH.LOGIN,
			{ email, requestSignInCode: true },
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Failed to send sign-in code");
		}
		return response.data;
	}

	async loginWithEmailCode(email: string, code: string): Promise<AuthData> {
		const response = await httpClient.post<AuthApiResponse>(
			API_ENDPOINTS.AUTH.LOGIN,
			{ email, emailSignInCode: code },
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Login failed");
		}
		return response.data;
	}

	async refreshTokens(data: RefreshTokenRequest): Promise<RefreshTokenData> {
		const response = await httpClient.post<RefreshTokenResponse>(
			API_ENDPOINTS.AUTH.REFRESH,
			data,
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "Token refresh failed");
		}
		return response.data;
	}

	async logout(data: LogoutRequest): Promise<string> {
		const response = await httpClient.post<LogoutResponse>(
			API_ENDPOINTS.AUTH.LOGOUT,
			data,
		);
		if (!response.success) {
			throw new Error(response.message || "Logout failed");
		}
		return response.message || "Logged out successfully";
	}

	async forgotPassword(email: string): Promise<string> {
		const response = await httpClient.post<ForgotPasswordResponse>(
			API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
			{ email },
		);
		if (!response.success) {
			throw new Error(response.message || "Request failed");
		}
		return response.message;
	}

	async resetPassword(token: string, password: string): Promise<string> {
		const response = await httpClient.post<ForgotPasswordResponse>(
			API_ENDPOINTS.AUTH.RESET_PASSWORD,
			{ token, password },
		);
		if (!response.success) {
			throw new Error(response.message || "Password reset failed");
		}
		return response.message;
	}

	async changePassword(
		oldPassword: string,
		newPassword: string,
	): Promise<string> {
		const response = await httpClient.post<ForgotPasswordResponse>(
			API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
			{ oldPassword, newPassword },
		);
		if (!response.success) {
			throw new Error(response.message || "Password change failed");
		}
		return response.message || "Password changed successfully";
	}

	async verify2FALogin(email: string, token: string): Promise<AuthData> {
		const response = await httpClient.post<AuthApiResponse>(
			API_ENDPOINTS.AUTH.VERIFY_2FA,
			{ email, token },
		);
		if (!response.success || !response.data) {
			throw new Error(response.message || "2FA verification failed");
		}
		return response.data;
	}
}

export const authService = new AuthService();
