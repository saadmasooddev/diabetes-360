import jwt from 'jsonwebtoken';
import { config } from '../../app/config';
import { type UserRole } from '../constants/roles';
import { UnauthorizedError } from '../errors';

export interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {

  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const expiresInSeconds = config.accessTokenExpiresIn;
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: expiresInSeconds,
    });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const expiresInSeconds = config.refreshTokenExpiresIn;
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: expiresInSeconds,
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }
}
