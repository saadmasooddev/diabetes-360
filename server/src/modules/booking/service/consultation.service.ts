import type { UserConsultationQuota } from "../models/consultation-quota.schema";
import { ConsultationQuotaRepository } from "../repository/consultation-quota.repository";

export class ConsultationService {
	private readonly consultationQuotaRepository: ConsultationQuotaRepository;
	constructor() {
		this.consultationQuotaRepository = new ConsultationQuotaRepository();
	}

	async getUserConsultationQuota(userId: string): Promise<{
		discountedConsultationsUsed: number;
		freeConsultationsUsed: number;
	}> {
		const quota =
			await this.consultationQuotaRepository.getUserConsultationQuota(userId);
		if (!quota) {
			return {
				discountedConsultationsUsed: 0,
				freeConsultationsUsed: 0,
			};
		}
		return {
			discountedConsultationsUsed: quota.discountedConsultationsUsed,
			freeConsultationsUsed: quota.freeConsultationsUsed,
		};
	}

	async getOrCreateUserConsultationQuota(
		userId: string,
	): Promise<UserConsultationQuota> {
		return await this.consultationQuotaRepository.getOrCreateUserConsultationQuota(
			userId,
		);
	}
}
