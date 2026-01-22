export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
	CONFLICT: 409,
	FORBIDDEN: 403,
} as const;

export const ERROR_MESSAGES = {
	USER_NOT_FOUND: "User not found",
	INVALID_CREDENTIALS: "Invalid credentials",
	USER_ALREADY_EXISTS: "An account with this email already exists",
	MISSING_USER_ID: "User ID is required",
	FAILED_TO_CREATE_ACCOUNT: "Failed to create account",
	LOGIN_FAILED: "Login failed",
	UNABLE_TO_PROCESS_REQUEST: "Unable to process request",
} as const;

export const SUCCESS_MESSAGES = {
	ACCOUNT_CREATED: "Account created successfully",
	LOGIN_SUCCESSFUL: "Login successful",
	PASSWORD_RESET_SENT:
		"If an account exists with this email, you will receive a password reset link shortly.",
} as const;
