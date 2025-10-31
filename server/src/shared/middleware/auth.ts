import { type Request, Response, NextFunction } from "express";
import { JWTService } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../errors";
import { USER_ROLES, type UserRole, hasPermission } from "../constants/roles";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
  };
}

export function authenticateToken(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);
    
    const payload = JWTService.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role || USER_ROLES.CUSTOMER, // Default to customer if role not in token
    };
    
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new ForbiddenError(`Access denied. Required permission: ${permission}`));
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    return next(new ForbiddenError("Admin access required"));
  }

  next();
}


export function requirePhysicianOrAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (![USER_ROLES.PHYSICIAN, USER_ROLES.ADMIN].includes(req.user.role as any)) {
    return next(new ForbiddenError("Physician or Admin access required"));
  }

  next();
}
