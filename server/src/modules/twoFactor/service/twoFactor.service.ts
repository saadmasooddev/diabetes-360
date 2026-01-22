import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import { TwoFactorRepository } from "../repository/twoFactor.repository";
import { BadRequestError, UnauthorizedError } from "../../../shared/errors";
import type {
	TwoFactorAuth,
	InsertTwoFactorAuth,
} from "../models/twoFactor.schema";

export interface Setup2FAResponse {
	secret: string;
	qrCodeUrl: string;
	backupCodes: string[];
}

export interface Verify2FAResponse {
	verified: boolean;
	backupCodes?: string[];
}

export class TwoFactorService {
	private twoFactorRepository: TwoFactorRepository;
	private readonly APP_NAME = "Diabetes 360";
	private readonly BACKUP_CODE_COUNT = 10;
	private readonly BACKUP_CODE_LENGTH = 8;

	constructor() {
		this.twoFactorRepository = new TwoFactorRepository();
	}

	/**
	 * Generate a new TOTP secret and QR code for setup
	 */
	async setup2FA(userId: string, userEmail: string): Promise<Setup2FAResponse> {
		// Check if 2FA already exists and is enabled
		const existing = await this.twoFactorRepository.getByUserId(userId);
		if (existing && existing.enabled && existing.verified) {
			throw new BadRequestError("Two-factor authentication is already enabled");
		}

		// Generate a new secret
		const secret = speakeasy.generateSecret({
			name: `${this.APP_NAME} (${userEmail})`,
			length: 32,
		});

		// Generate backup codes
		const backupCodes = this.generateBackupCodes();

		// Create or update the 2FA record
		const twoFactorData: InsertTwoFactorAuth = {
			userId,
			secret: secret.base32, // Store base32 encoded secret
			backupCodes: JSON.stringify(
				backupCodes.map((code) => this.hashBackupCode(code)),
			),
			enabled: false, // Not enabled until verified
			verified: false,
		};

		if (existing) {
			await this.twoFactorRepository.update(userId, twoFactorData);
		} else {
			await this.twoFactorRepository.create(twoFactorData);
		}

		// Generate QR code
		const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

		return {
			secret: secret.base32,
			qrCodeUrl,
			backupCodes, // Return plain backup codes for user to save
		};
	}

	/**
	 * Verify the TOTP code and enable 2FA
	 */
	async verifyAndEnable2FA(
		userId: string,
		token: string,
	): Promise<Verify2FAResponse> {
		const twoFactor = await this.twoFactorRepository.getByUserId(userId);
		if (!twoFactor) {
			throw new BadRequestError("Two-factor authentication not set up");
		}

		if (twoFactor.enabled && twoFactor.verified) {
			throw new BadRequestError("Two-factor authentication is already enabled");
		}

		// Verify the TOTP token
		const verified = speakeasy.totp.verify({
			secret: twoFactor.secret,
			encoding: "base32",
			token,
			window: 2, // Allow 2 time steps (60 seconds) of tolerance
		});

		if (!verified) {
			throw new UnauthorizedError("Invalid verification code");
		}

		// Enable and verify 2FA
		await this.twoFactorRepository.update(userId, {
			enabled: true,
			verified: true,
		});

		// Note: Backup codes are already stored hashed, so we can't return them here
		// They should have been saved by the user during setup
		return {
			verified: true,
		};
	}

	/**
	 * Verify a TOTP token during login
	 */
	async verifyToken(userId: string, token: string): Promise<boolean> {
		const twoFactor = await this.twoFactorRepository.getByUserId(userId);
		if (!twoFactor || !twoFactor.enabled || !twoFactor.verified) {
			return false;
		}

		// Try TOTP verification first
		const totpVerified = speakeasy.totp.verify({
			secret: twoFactor.secret,
			encoding: "base32",
			token,
			window: 2,
		});

		if (totpVerified) {
			return true;
		}

		// If TOTP fails, try backup codes
		if (twoFactor.backupCodes) {
			const hashedBackupCodes = JSON.parse(twoFactor.backupCodes);
			const inputHash = this.hashBackupCode(token);

			const codeIndex = hashedBackupCodes.findIndex(
				(hashed: string) => hashed === inputHash,
			);

			if (codeIndex !== -1) {
				// Remove used backup code
				hashedBackupCodes.splice(codeIndex, 1);
				await this.twoFactorRepository.update(userId, {
					backupCodes: JSON.stringify(hashedBackupCodes),
				});
				return true;
			}
		}

		return false;
	}

	/**
	 * Disable 2FA for a user
	 */
	async disable2FA(userId: string): Promise<void> {
		const twoFactor = await this.twoFactorRepository.getByUserId(userId);
		if (!twoFactor || !twoFactor.enabled) {
			throw new BadRequestError("Two-factor authentication is not enabled");
		}

		await this.twoFactorRepository.update(userId, {
			enabled: false,
			verified: false,
			secret: "", // Clear secret
			backupCodes: null, // Clear backup codes
		});
	}

	/**
	 * Get 2FA status for a user
	 */
	async get2FAStatus(userId: string): Promise<{
		enabled: boolean;
		verified: boolean;
	}> {
		const twoFactor = await this.twoFactorRepository.getByUserId(userId);
		if (!twoFactor) {
			return { enabled: false, verified: false };
		}

		return {
			enabled: twoFactor.enabled,
			verified: twoFactor.verified,
		};
	}

	/**
	 * Regenerate backup codes
	 */
	async regenerateBackupCodes(userId: string): Promise<string[]> {
		const twoFactor = await this.twoFactorRepository.getByUserId(userId);
		if (!twoFactor || !twoFactor.enabled) {
			throw new BadRequestError("Two-factor authentication is not enabled");
		}

		const backupCodes = this.generateBackupCodes();
		const hashedBackupCodes = backupCodes.map((code) =>
			this.hashBackupCode(code),
		);

		await this.twoFactorRepository.update(userId, {
			backupCodes: JSON.stringify(hashedBackupCodes),
		});

		return backupCodes;
	}

	/**
	 * Generate backup codes
	 */
	private generateBackupCodes(): string[] {
		const codes: string[] = [];
		for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
			const code = crypto
				.randomBytes(this.BACKUP_CODE_LENGTH)
				.toString("hex")
				.toUpperCase()
				.slice(0, this.BACKUP_CODE_LENGTH);
			codes.push(code);
		}
		return codes;
	}

	/**
	 * Hash a backup code for storage
	 */
	private hashBackupCode(code: string): string {
		return crypto.createHash("sha256").update(code).digest("hex");
	}
}
