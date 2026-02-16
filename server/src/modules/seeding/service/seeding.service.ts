import { TimeZoneRepository } from "server/src/shared/repository/timeZone.repository";
import { SettingsRepository } from "../../settings/repository/settings.repository";

export class SeedingService {
	settingsRepository: SettingsRepository;
	timeZoneRepository: TimeZoneRepository;

	private readonly DEFAULT_LIMITS = {
		glucoseLimit: 2,
		stepsLimit: 2,
		waterLimit: 2,
		discountedConsultationQuota: 0,
		freeConsultationQuota: 0,
	};
	private readonly DEFAULT_FOOD_SCAN_LIMITS = {
		freeUserLimit: 5,
		paidUserLimit: 20,
	};

	constructor() {
		this.timeZoneRepository = new TimeZoneRepository();
		this.settingsRepository = new SettingsRepository();
	}

	async seedSettings() {
		const foodScanLimits = await this.settingsRepository.getFoodScanLimits();
		if (!foodScanLimits) {
			await this.settingsRepository.createFoodScanLimits({
				freeUserLimit: this.DEFAULT_FOOD_SCAN_LIMITS.freeUserLimit,
				paidUserLimit: this.DEFAULT_FOOD_SCAN_LIMITS.paidUserLimit,
			});
		}
		console.log("Food scan limits seeded successfully");

		const generalLimits = await this.settingsRepository.getLogLimits();
		if (!generalLimits) {
			await this.settingsRepository.createFreeTierLimits({
				glucoseLimit: this.DEFAULT_LIMITS.glucoseLimit,
				stepsLimit: this.DEFAULT_LIMITS.stepsLimit,
				waterLimit: this.DEFAULT_LIMITS.waterLimit,
				discountedConsultationQuota:
					this.DEFAULT_LIMITS.discountedConsultationQuota,
				freeConsultationQuota: this.DEFAULT_LIMITS.freeConsultationQuota,
			});
		}

		const timeZones = Intl.supportedValuesOf("timeZone");
		const existingTimeZones = await this.timeZoneRepository.getTimeZones();
		if (!existingTimeZones) {
			await this.timeZoneRepository.seedTimeZones(timeZones);
		}

		return "Seedinng completed successfully";
	}
}
