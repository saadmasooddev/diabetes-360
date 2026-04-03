import { DIABETES_TYPE, type FcmRegistrationInput } from "@shared/schema";
import { AuthResponse, SignupResponse } from "server/src/modules/auth/services/auth.service";

export type PaymentType = "free" | "monthly" | "annual";

export interface CustomerData {
	id: string;
	userId: string;
	gender: "male" | "female";
	birthday: string;
	weight: string;
	height: string;
	diabetesType: DIABETES_TYPE;
	createdAt: string;
	updatedAt: string;
}

export interface PhysicianData {
	id: string;
	userId: string;
	specialtyId: string;
	specialty?: string | null;
	practiceStartDate: string;
	consultationFee: string;
	imageUrl?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	emailVerified: boolean;
	provider: string;
	providerId?: string;
	avatar?: string;
	role: "customer" | "admin" | "physician";
	paymentType?: PaymentType;
	isActive: boolean;
	profileComplete: boolean;
	profileData?: CustomerData | PhysicianData | null;
	permissions?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

// Backend response structure
export interface ApiResponse<T = any> {
	status: number;
	success: boolean;
	data?: T;
	message: string;
}

// Auth-specific response data
export interface AuthData extends AuthResponse {} 

export interface RefreshTokenData {
	tokens: TokenPair;
}

export interface LogoutData {
	message: string;
}

export interface ForgotPasswordData {
	message: string;
}


export interface SignupRes extends ApiResponse<SignupResponse> {}

// Response types for each endpoint
export interface AuthApiResponse extends ApiResponse<AuthData> {}
export interface RefreshTokenResponse extends ApiResponse<RefreshTokenData> {}
export interface LogoutResponse extends ApiResponse<LogoutData> {}
export interface ForgotPasswordResponse
	extends ApiResponse<ForgotPasswordData> {}

export interface SignupRequest {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface LoginRequest {
	email: string;
	password?: string;
	requestSignInCode?: boolean;
	emailSignInCode?: string;
	fcm?: FcmRegistrationInput;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}

export interface LogoutRequest {
	refreshToken: string;
	fcm?: FcmRegistrationInput;
}

export interface AuthError {
	message: string;
	statusCode?: number;
}
