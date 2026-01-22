export interface Appointment {
	id: string;
	time: string;
	date: string;
	patientName: string;
	type: "Video Call" | "In Person";
}

export interface PatientAlert {
	id: string;
	patientName: string;
	alert: string;
	severity: "high" | "low";
}

export interface Patient {
	id: string;
	name: string;
	age: number;
	condition: string;
	status: "Needs Attention" | "Stable";
	avatar?: string;
}

export const mockAppointments: Appointment[] = [
	{
		id: "1",
		time: "12:05 PM",
		date: "08/11/25",
		patientName: "Arsalan Shaikh",
		type: "Video Call",
	},
	{
		id: "2",
		time: "08:05 PM",
		date: "08/11/25",
		patientName: "Irum",
		type: "In Person",
	},
	{
		id: "3",
		time: "08:05 PM",
		date: "08/11/25",
		patientName: "Irum",
		type: "In Person",
	},
];

export const mockPatientAlerts: PatientAlert[] = [
	{
		id: "1",
		patientName: "Arsalan",
		alert: "Low glucose at 58 mg/dl",
		severity: "low",
	},
	{
		id: "2",
		patientName: "Irum",
		alert: "High glucose at 280 mg/dl",
		severity: "high",
	},
	{
		id: "3",
		patientName: "Irum",
		alert: "High glucose at 280 mg/dl",
		severity: "high",
	},
];

export const mockPatients: Patient[] = [
	{
		id: "1",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		status: "Needs Attention",
	},
	{
		id: "2",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		status: "Stable",
	},
	{
		id: "3",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		status: "Stable",
	},
];

export interface PatientListItem {
	id: string;
	name: string;
	age: number;
	condition: string;
	indication: "Needs Attention" | "Stable" | "High Risk";
}

export const mockPatientsList: PatientListItem[] = [
	{
		id: "1",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		indication: "Needs Attention",
	},
	{
		id: "2",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		indication: "Stable",
	},
	{
		id: "3",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		indication: "High Risk",
	},
	{
		id: "4",
		name: "Arsalan Khan",
		age: 46,
		condition: "Diabetes Type 1",
		indication: "High Risk",
	},
];

export const mockPatientsDisease = [
	{ name: "Diabetes Type 1", percentage: 25, color: "#B2DFDB" },
	{ name: "Diabetes Type 2", percentage: 75, color: "#00856F" },
	{ name: "Chronic Inflamation", percentage: 35, color: "#00453A" },
];

export const mockPatientsIndication = [
	{ name: "Stable", percentage: 25, color: "#B2DFDB" },
	{ name: "High Risk", percentage: 75, color: "#00856F" },
	{ name: "Needs Attention", percentage: 35, color: "#00453A" },
];

export const mockDoctorProfile = {
	name: "Doctor Zeeshan",
	specialty: "DIABETOLOGIST",
	avatar: "",
};

export interface PatientProfile {
	id: string;
	name: string;
	age: number;
	condition: string;
	riskLevel: "High Risk" | "Stable" | "Needs Attention";
	alerts: string[];
	glucoseSummary: {
		highs: number;
		lows: number;
		timeInRange: number;
	};
	recentNotes: string[];
	appointments: {
		time: string;
		date: string;
		type: string;
	}[];
	glucoseTrend: {
		time: string;
		value: number;
	}[];
}

export const mockPatientProfile: PatientProfile = {
	id: "1",
	name: "Arsalan Khan",
	age: 46,
	condition: "Diabetes Type 1",
	riskLevel: "High Risk",
	alerts: ["Glucose Spikes", "No Activity in last 24hrs", "Missed Meals"],
	glucoseSummary: {
		highs: 67,
		lows: 12,
		timeInRange: 35,
	},
	recentNotes: [
		"Consider increasing activity.",
		"Have short meals every 3 hours",
		"Consider following up next week",
	],
	appointments: [
		{
			time: "12:05 PM",
			date: "08/11/25",
			type: "Video Call",
		},
	],
	glucoseTrend: [
		{ time: "7 AM", value: 75 },
		{ time: "8 AM", value: 80 },
		{ time: "9 AM", value: 88 },
		{ time: "10 AM", value: 95 },
		{ time: "11 AM", value: 90 },
		{ time: "12 PM", value: 82 },
		{ time: "1 PM", value: 78 },
		{ time: "2 PM", value: 82 },
		{ time: "3 PM", value: 88 },
		{ time: "4 PM", value: 92 },
		{ time: "5 PM", value: 85 },
		{ time: "6 PM", value: 80 },
	],
};
