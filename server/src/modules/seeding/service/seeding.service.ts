import { TimeZoneRepository } from "server/src/shared/repository/timeZone.repository";
import { SettingsRepository } from "../../settings/repository/settings.repository";
import { BookingRepository } from "../../booking/repository/booking.repository";
import { SLOT_TYPE, slotSize } from "../../booking/models/booking.schema";

export class SeedingService {
	settingsRepository: SettingsRepository;
	timeZoneRepository: TimeZoneRepository;
	bookingRepository: BookingRepository

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

	private readonly DEFAULT_SLOT_SIZES = [
		{ size: 10},
		{ size: 15},
		{ size: 30},
		{ size: 45},
		{size: 60},
		{size: 90},
	]

	constructor() {
		this.timeZoneRepository = new TimeZoneRepository();
		this.settingsRepository = new SettingsRepository();
		this.bookingRepository = new BookingRepository()
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
		console.log("General limits seeded successfully");

		const slotSizes = await this.bookingRepository.getAllSlotSizes()
		const missingSlotSizes = this.DEFAULT_SLOT_SIZES.filter(ds => !slotSizes.some(sz => ds.size === sz.size))
		if(missingSlotSizes.length > 0) {
			await this.bookingRepository.createSlotSizes(missingSlotSizes)
		}
		console.log("the slot sizes are successfully seeded")

		const slotTypes = await this.bookingRepository.getAllSlotTypes()
		if(slotTypes.length === 0) {
			await this.bookingRepository.createSlotTypes(
				[				
					{
						type: SLOT_TYPE.ONLINE,
					},
					{
						type:SLOT_TYPE.ONSITE
					}
        ]
			)
		}
		console.log("The slot type are successfully seeded")

		const timeZones = Intl.supportedValuesOf("timeZone");
		const existingTimeZones = await this.timeZoneRepository.getTimeZones();
		if (existingTimeZones.length === 0) {
			await this.timeZoneRepository.seedTimeZones(timeZones);
		}

		console.log("Time zones seeded successfully");
		return "Seedinng completed successfully";
	}

}
