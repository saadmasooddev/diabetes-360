import dotenv from "dotenv";
dotenv.config();

export const config = {
	port: parseInt(process.env.PORT || "5001", 10),
	env: process.env.NODE_ENV || "development",
	jwtSecret: process.env.JWT_SECRET || "your-secret-key",
	bcryptRounds: 10,
	databaseUrl: process.env.DATABASE_URL || "",
	email: {
		apiKey: process.env.SENDGRID_API_KEY || "",
		from: process.env.EMAIL_FROM || "noreply@diabetes360.com",
		fromName: process.env.EMAIL_FROM_NAME || "Diabetes 360",
	},
	frontendUrl: process.env.FRONTEND_URL || process.env.VITE_REACT_API_BASE_URL || "http://localhost:5000",
	accessTokenExpiresIn: Math.floor(
		Number(process.env.ACCESS_TOKEN_EXPIRES_IN || "0") * 60 || 15 * 60,
	),
	refreshTokenExpiresIn: Math.floor(
		Number(process.env.REFRESH_TOKEN_EXPIRES_IN || "0") * 24 * 60 * 60 ||
			7 * 24 * 60 * 60,
	),
	passio: {
		apiKey: process.env.PASSIO_API_KEY || "",
	},
	ai: {
		baseUrl: process.env.AI_BASE_URL,
	},
	zoom: {
		accountId: process.env.ZOOM_ACCOUNT_ID || "",
		clientId: process.env.ZOOM_CLIENT_ID || "",
		clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
	},
} as const;
