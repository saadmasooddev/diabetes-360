import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../shared/middleware/auth";
import { sendSuccess } from "../../../app/utils/response";
import { TwoFactorService } from "../service/twoFactor.service";
import { BadRequestError } from "../../../shared/errors";
import { handleError } from "../../../shared/middleware/errorHandler";
import { z } from "zod";

const verifyTokenSchema = z.object({
	token: z.string().length(6, "Token must be 6 digits"),
});

export class TwoFactorController {
	private twoFactorService: TwoFactorService;

	constructor() {
		this.twoFactorService = new TwoFactorService();
	}

	/**
	 * Get 2FA status for the authenticated user
	 */
	async get2FAStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				throw new BadRequestError("User not authenticated");
			}

			const status = await this.twoFactorService.get2FAStatus(req.user.userId);
			sendSuccess(res, status, "2FA status retrieved successfully");
		} catch (error) {
			handleError(res, error);
		}
	}

	/**
	 * Setup 2FA - generate secret and QR code
	 */
	async setup2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				throw new BadRequestError("User not authenticated");
			}

			const result = await this.twoFactorService.setup2FA(
				req.user.userId,
				req.user.email,
			);
			sendSuccess(res, result, "2FA setup initiated successfully");
		} catch (error) {
			handleError(res, error);
		}
	}

	/**
	 * Verify TOTP token and enable 2FA
	 */
	async verifyAndEnable2FA(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				throw new BadRequestError("User not authenticated");
			}

			const { token } = verifyTokenSchema.parse(req.body);
			const result = await this.twoFactorService.verifyAndEnable2FA(
				req.user.userId,
				token,
			);
			sendSuccess(res, result, "2FA enabled successfully");
		} catch (error) {
			handleError(res, error);
		}
	}

	/**
	 * Disable 2FA
	 */
	async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			if (!req.user) {
				throw new BadRequestError("User not authenticated");
			}

			await this.twoFactorService.disable2FA(req.user.userId);
			sendSuccess(res, null, "2FA disabled successfully");
		} catch (error) {
			handleError(res, error);
		}
	}

	/**
	 * Regenerate backup codes
	 */
	async regenerateBackupCodes(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				throw new BadRequestError("User not authenticated");
			}

			const backupCodes = await this.twoFactorService.regenerateBackupCodes(
				req.user.userId,
			);
			sendSuccess(
				res,
				{ backupCodes },
				"Backup codes regenerated successfully",
			);
		} catch (error) {
			handleError(res, error);
		}
	}
}
