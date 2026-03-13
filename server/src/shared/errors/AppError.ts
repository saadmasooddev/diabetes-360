import { ZodError } from "zod";
import { HTTP_STATUS } from "../../app/constants";

export class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;

	constructor(
		message: string,
		statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
		isOperational: boolean = true,
	) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string = "Validation error", error?: ZodError) {
		if (error instanceof ZodError) {
			super(
				error.issues.map((i) => i.message).join(", "),
				HTTP_STATUS.BAD_REQUEST,
			);
			return;
		}
		super(message, HTTP_STATUS.BAD_REQUEST);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = "Resource not found") {
		super(message, HTTP_STATUS.NOT_FOUND);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = "Unauthorized") {
		super(message, HTTP_STATUS.UNAUTHORIZED);
	}
}

export class ConflictError extends AppError {
	constructor(message: string = "Resource already exists") {
		super(message, HTTP_STATUS.CONFLICT);
	}
}

export class PreconditionFailedError extends AppError {
	constructor(message: string = "Precondition failed") {
		super(message, HTTP_STATUS.PRECONDITION_FAILED)
	}
}

export class BadRequestError extends AppError {
	constructor(message: string = "Bad request") {
		super(message, HTTP_STATUS.BAD_REQUEST);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = "Forbidden") {
		super(message, HTTP_STATUS.FORBIDDEN);
	}
}
