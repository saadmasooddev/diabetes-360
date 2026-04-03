import { METRIC_TYPE_ENUM } from "../../health/models/health.schema";
import { HealthRepository } from "../../health/repository/health.repository";
import {
	PUSH_MESSAGE_TYPE_ENUM,
} from "../models/fcm.schema";
import { PushNotificationLogRepository } from "../repositories/push-notification-log.repository";
import { PushNotificationService } from "./push-notification.service";


export class GlucoseAlertService {
private readonly GLUCOSE_ALERT_COOLDOWN_MS = 60 * 60 * 1000;

private readonly DEFAULT_GLUCOSE_LOW_MG_DL = 70;
private  readonly DEFAULT_GLUCOSE_HIGH_MG_DL = 180;
	constructor(
		private readonly healthRepository = new HealthRepository(),
		private readonly pushService = new PushNotificationService(),
		private readonly logRepository = new PushNotificationLogRepository(),
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

		const since = new Date(Date.now() - this.GLUCOSE_ALERT_COOLDOWN_MS);
		const recent = await this.logRepository.hasRecentByType(
			userId,
			PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT,
			since,
		);
		if (recent) return;

		const title =
			direction === "high" ? "Glucose above your target" : "Glucose below range";
		const body =
			direction === "high"
				? `Your latest reading is ${latest} mg/dL, above your high threshold (${highTh} mg/dL).`
				: `Your latest reading is ${latest} mg/dL, below your low threshold (${lowTh} mg/dL).`;

		await this.pushService.sendDataOnlyToUser(userId, {
			type: PUSH_MESSAGE_TYPE_ENUM.GLUCOSE_ALERT,
			title,
			body,
			data: {
				glucoseMgDl: latest,
				direction,
				lowThresholdMgDl: lowTh,
				highThresholdMgDl: highTh,
			},
		});
	}
}
