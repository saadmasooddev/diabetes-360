import { FcmRegistrationInput } from "@shared/schema";
import { FcmTokenRepository } from "../repositories/fcm-token.repository";

export class NotificationsService {
	private readonly fcmTokenRepository: FcmTokenRepository;

	constructor(fcmTokenRepository = new FcmTokenRepository()) {
		this.fcmTokenRepository = fcmTokenRepository;
	}

	async storeFcmToken(
		userId: string,
		fcm: FcmRegistrationInput,
	): Promise<void> {
		await this.fcmTokenRepository.upsertToken(
			userId,
			fcm.token,
			fcm.deviceType,
		);
	}
}
