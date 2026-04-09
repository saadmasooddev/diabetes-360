import { BookingService } from "../../booking/service/booking.service";
import { METRIC_TYPE_ENUM } from "../../health/models/health.schema";
import { HealthRepository } from "../../health/repository/health.repository";
import {
	GlucoseAlertPushPayload,
	PUSH_MESSAGE_TYPE_ENUM,
} from "../models/fcm.schema";
import { PushNotificationService } from "./push-notification.service";

export class GlucoseAlertService {
	private readonly DEFAULT_GLUCOSE_LOW_MG_DL = 70;
	private readonly DEFAULT_GLUCOSE_HIGH_MG_DL = 180;
	constructor(
		private readonly healthRepository = new HealthRepository(),
		private readonly pushService = new PushNotificationService(),
		private readonly bookingService = new BookingService()
	) {}



resolveGlucoseHighThresholdMgDl(
	userTargetValue: number | null,
	recommendedTargetValue: number | null,
): number {
	const v = userTargetValue ?? recommendedTargetValue;
	if (v == null || Number.isNaN(v)) {
		return this.DEFAULT_GLUCOSE_HIGH_MG_DL;
	}
	return v;
}

evaluateGlucoseDirection(
	glucoseMgDl: number,
	highThresholdMgDl: number,
	lowThresholdMgDl: number,
): "high" | "low" | null {
	if (glucoseMgDl > highThresholdMgDl) return "high";
	if (glucoseMgDl < lowThresholdMgDl) return "low";
	return null;
}
	async checkAndNotifyIfNeeded(userId: string): Promise<void> {
		const latest = await this.healthRepository.getLatestBloodGlucoseForAlerts(
			userId,
		);
		if (latest == null) return;

		const [userTarget, recTarget] = await Promise.all([
			this.healthRepository.getTargetByMetricType(
				userId,
				METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
			),
			this.healthRepository.getTargetByMetricType(
				null,
				METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
			),
		]);

		const userHigh = userTarget?.targetValue
			? parseFloat(userTarget.targetValue.toString())
			: null;
		const recHigh = recTarget?.targetValue
			? parseFloat(recTarget.targetValue.toString())
			: null;
		const highTh = this.resolveGlucoseHighThresholdMgDl(userHigh, recHigh);
		const lowTh = this.DEFAULT_GLUCOSE_LOW_MG_DL;

		const direction = this.evaluateGlucoseDirection(latest, highTh, lowTh);
		if (!direction) return;

		const title =
			direction === "high" ? "Glucose above your target" : "Glucose below range";
		const body =
			direction === "high"
				? `Your latest reading is ${latest} mg/dL, above your high threshold (${highTh} mg/dL).`
				: `Your latest reading is ${latest} mg/dL, below your low threshold (${lowTh} mg/dL).`;

		const notificationPayload: GlucoseAlertPushPayload = {
			glucoseMgDl: latest,
			direction,
			lowThresholdMgDl: lowTh,
			highThresholdMgDl: highTh,
		}

		const physician = await this.bookingService.getLatestPhysicianTrackingPatient(userId)
		if(physician) {
			this.pushService.sendDataOnlyToUser(physician.id, {
				type: PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT,
				title: "Patient Glucose Alert",
				body: direction === "high" 
				  ? `${physician.firstName} ${physician.lastName} is experiencing a high glucose level of ${latest} mg/dL`
					: `${physician.firstName} ${physician.lastName} is experiencing a low glucose level of ${latest} mg/dL`,
				data: notificationPayload
			}).then().catch(console.error)
		}

		this.pushService.sendDataOnlyToUser(userId, {
			type: PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT,
			title,
			body,
			data: notificationPayload 
		}).then().catch(console.error)
	}
}
