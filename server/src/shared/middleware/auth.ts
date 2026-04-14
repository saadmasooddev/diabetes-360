import type { Request, Response, NextFunction } from "express";
import { JWTService } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../errors";
import { USER_ROLES, type UserRole } from "@shared/schema";

export interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
		email: string;
		firstName: string;
		lastName: string;
		role: UserRole;
		permissions: string[];
	};
}

export function authenticateToken(
	req: AuthenticatedRequest,
	_res: Response,
	next: NextFunction,
): void {
	try {
		const authHeader = req.headers.authorization;
		const token = JWTService.extractTokenFromHeader(authHeader);

		const payload = JWTService.verifyAccessToken(token);
		req.user = {
			userId: payload.userId,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			role: payload.role || USER_ROLES.CUSTOMER, // Default to customer if role not in token
			permissions: payload.permissions || [],
		};

		next();
	} catch (error) {
		next(new UnauthorizedError());
	}
}

export function requirePermission(permission: string) {
	return (
		req: AuthenticatedRequest,
		_res: Response,
		next: NextFunction,
	): void => {
		if (!req.user) {
			next(new UnauthorizedError("Authentication required"));
			return
		}

		if (!req.user.permissions.includes(permission)) {
			next(
				new ForbiddenError(`Access denied. Required permission: ${permission}`),
			);
		}

		next();
	};
}

export function requireAnyPermission(permissions: string[]) {
	return (
		req: AuthenticatedRequest,
		_res: Response,
		next: NextFunction,
	): void => {
		if (!req.user) {
			next(new UnauthorizedError("Authentication required"));
		}

		if (!req.user!.permissions.some((p) => permissions.includes(p))) {
			next(
				new ForbiddenError(
					`Access denied. Required permission: ${permissions.join(", ")}`,
				),
			);
		}
		next();
	};
}
