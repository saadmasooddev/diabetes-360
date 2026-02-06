import { DIABETES_TYPE } from "../../auth/models/user.schema";

export enum PATIENT_INDICATION {
	HIGH_RISK = "High Risk",
	STABLE = "Stable",
	NEEDS_ATTENTION = "Needs Attention",
}
export const INDICATION_COLORS = {
	[PATIENT_INDICATION.HIGH_RISK]: "#FF6B6B",
	[PATIENT_INDICATION.STABLE]: "#00856F",
	[PATIENT_INDICATION.NEEDS_ATTENTION]: "#FFB74D",
} as const;

export const STATUS_COLORS = {
	[PATIENT_INDICATION.HIGH_RISK]: "#FF6B6B",
	[PATIENT_INDICATION.STABLE]: "#00856F",
	[PATIENT_INDICATION.NEEDS_ATTENTION]: "#FFB74D",
} as const;

export const DIABETES_TYPE_COLORS = {
	"Diabetes Type 1": "#00856F",
	"Diabetes Type 2": "#FFB74D",
	"Gestational Diabetes": "#FF6B6B",
	Prediabetes: "#E6A23C",
} as const;

export const ALERT_TAG_COLORS: Record<string, string> = {
	"Glucose Spikes": "#00856F",
	"No Activity in last 24hrs": "#E6A23C",
	"Missed Meals": "#FF6B6B",
	"Over Eating": "#E65100",
	"Under Eating": "#F9A825",
	"No Alerts": "#43A047",
};

export function getIndicationColor(indication: PATIENT_INDICATION): string {
	return INDICATION_COLORS[indication] || "#757575";
}

export function getStatusColor(status: PATIENT_INDICATION): string {
	return STATUS_COLORS[status] || "#757575";
}

export function getAlertTagColor(alert: string): string {
	return ALERT_TAG_COLORS[alert] || "#757575";
}

export function getDiseaseColor(
	disease: keyof typeof DIABETES_TYPE_COLORS,
): string {
	return DIABETES_TYPE_COLORS[disease] || "#757575";
}
