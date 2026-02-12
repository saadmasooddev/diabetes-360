import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppointments } from "@/hooks/mutations/useAppointments";
import { usePatientAlerts, usePatients } from "@/hooks/mutations/usePatients";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/utils/permissions";
import { AccessControl } from "@/components/common/AccessControl";

function ToggleIcon() {
	return (
		<svg width="28" height="16" viewBox="0 0 28 16" fill="none">
			<rect width="28" height="16" rx="8" fill="#00453A" />
			<circle cx="20" cy="8" r="6" fill="white" />
		</svg>
	);
}

function PatientsIcon() {
	return (
		<svg width="28" height="16" viewBox="0 0 28 16" fill="none">
			<circle cx="8" cy="8" r="6" fill="#00453A" />
			<circle cx="18" cy="8" r="6" fill="#B2DFDB" />
		</svg>
	);
}

function PatientAlertsIcon() {
	return (
		<svg width="28" height="16" viewBox="0 0 28 16" fill="none">
			<circle cx="8" cy="8" r="6" fill="#E53935" />
			<circle cx="20" cy="8" r="6" fill="#FFCDD2" />
		</svg>
	);
}

function getIndicationStyle(indicationColor: string) {
	// Convert hex color to rgba for background
	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	return {
		background: hexToRgba(indicationColor, 0.1),
		color: indicationColor,
	};
}

function getStatusDisplayText(status: string) {
	switch (status) {
		case "high-risk":
			return "High Risk";
		case "needs-attention":
			return "Needs Attention";
		case "stable":
			return "Stable";
		default:
			return status;
	}
}

function getStatusStyle(status: string) {
	switch (status) {
		case "High Risk":
			return {
				background: "#FFEBEE",
				color: "#E53935",
			};
		case "Needs Attention":
			return {
				background: "#FFF3E0",
				color: "#F57C00",
			};
		case "Stable":
			return {
				background: "#E8F5E9",
				color: "#43A047",
			};
		default:
			return {
				background: "#F5F5F5",
				color: "#757575",
			};
	}
}

export function DoctorHome() {
	const [, navigate] = useLocation();
	const { hasAnyPermission } = usePermissions();
	const hasReadAllAppointments = hasAnyPermission([
		PERMISSIONS.READ_ALL_APPOINTMENTS,
	]);

	const today = new Date().toISOString().split("T")[0];
	const { data, isLoading, error } = useAppointments({
		page: 1,
		limit: 3,
		startDate: today,
		endDate: today,
	});

	const { data: patientsData, isLoading: isLoadingPatients } = usePatients({
		page: 1,
		limit: 3,
	});

	const {
		data: alertsData,
		isLoading: isLoadingPatientAlers,
		error: errorPatientAlerts,
	} = usePatientAlerts();

	const appointments = data?.appointments || [];
	const appointmentsCount = data?.total || 0;
	const patients = patientsData?.patients || [];

	// Create prioritized list of patient alerts: high risk > needs attention > stable
	const prioritizedAlerts = React.useMemo(() => {
		if (!alertsData) return [];
		const highRisk = alertsData.highRisk || [];
		const needsAttention = alertsData.needsAttention || [];
		const stable = alertsData.stable || [];

		const allAlerts = [...highRisk, ...needsAttention, ...stable];
		return allAlerts.slice(0, 3);
	}, [alertsData]);

	const alertsCount = React.useMemo(() => {
		if (!alertsData) return 0;
		return (
			(alertsData.highRisk?.length || 0) +
			(alertsData.needsAttention?.length || 0) +
			(alertsData.stable?.length || 0)
		);
	}, [alertsData]);

	const handleViewAllAppointments = () => {
		const viewAllAppointmentsPage = hasReadAllAppointments
			? ROUTES.ADMIN_APPOINTMENTS
			: ROUTES.DOCTOR_APPOINTMENTS;
		navigate(viewAllAppointmentsPage);
	};

	const handleViewAllPatients = () => {
		const isAdmin = window.location.pathname.startsWith("/dashboard/admin");
		const route = isAdmin ? ROUTES.ADMIN_PATIENTS : ROUTES.DOCTOR_PATIENTS;
		navigate(route);
	};

	const handleViewPatientProfile = (patientId: string) => {
		const isAdmin = window.location.pathname.startsWith("/dashboard/admin");
		const route = isAdmin
			? ROUTES.ADMIN_PATIENT_PROFILE.replace(":profileId", patientId)
			: ROUTES.DOCTOR_PATIENT_PROFILE.replace(":profileId", patientId);
		navigate(route);
	};

	const handleViewAllAlerts = () => {
		const isAdmin = window.location.pathname.startsWith("/dashboard/admin");
		const route = isAdmin
			? ROUTES.ADMIN_PATIENTS_ALERTS
			: ROUTES.DOCTOR_PATIENTS_ALERTS;
		navigate(route);
	};

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<main className="flex-1 p-4 lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6 ">
					{/* Today's Appointments */}
					<Card
						className="p-6"
						style={{
							background: "#FFFFFF",
							borderRadius: "16px",
							border: "1px solid rgba(0, 0, 0, 0.08)",
						}}
						data-testid="card-todays-appointments"
					>
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<ToggleIcon />
								<h2
									style={{
										fontSize: "22px",
										fontWeight: 700,
										color: "#00453A",
									}}
								>
									Today's Appointments
								</h2>
							</div>
							{isLoading ? (
								<Loader2 className="h-12 w-12 animate-spin text-[#00453A]" />
							) : (
								<span
									style={{
										fontSize: "48px",
										fontWeight: 300,
										color: "#00453A",
									}}
									data-testid="text-appointments-count"
								>
									{String(appointmentsCount).padStart(2, "0")}
								</span>
							)}
						</div>

						{/* Appointments Table */}
						{isLoading ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
							</div>
						) : error ? (
							<div className="text-center py-12 text-red-500">
								Failed to load appointments. Please try again.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full  " data-testid="table-appointments">
									<thead>
										<tr>
											<th
												className="text-left pb-4"
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#78909C",
												}}
											>
												Time
											</th>
											<th
												className="text-left pb-4"
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#78909C",
												}}
											>
												Date
											</th>
											<th
												className="text-left pb-4"
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#78909C",
												}}
											>
												Patient Name
											</th>
											<AccessControl
												permission={PERMISSIONS.READ_ALL_APPOINTMENTS}
											>
												<th
													className="text-left pb-4"
													style={{
														fontSize: "14px",
														fontWeight: 500,
														color: "#78909C",
													}}
												>
													Doctor Name
												</th>
											</AccessControl>
											<th
												className="text-left pb-4"
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#78909C",
												}}
											>
												In Person/Video Call
											</th>
										</tr>
									</thead>
									<tbody>
										{appointments.length === 0 ? (
											<tr>
												<td
													colSpan={hasReadAllAppointments ? 5 : 4}
													className="py-8 text-center text-gray-500"
												>
													No appointments scheduled for today
												</td>
											</tr>
										) : (
											appointments.map((appointment) => (
												<tr
													key={appointment.id}
													className="border-t border-gray-100"
													data-testid={`row-appointment-${appointment.id}`}
												>
													<td
														className="py-4"
														style={{
															fontSize: "15px",
															fontWeight: 600,
															color: "#00856F",
														}}
													>
														{appointment.time}
													</td>
													<td
														className="py-4"
														style={{
															fontSize: "15px",
															fontWeight: 500,
															color: "#37474F",
														}}
													>
														{appointment.date}
													</td>
													<td
														className="py-4"
														style={{
															fontSize: "15px",
															fontWeight: 600,
															color: "#00856F",
														}}
													>
														{appointment.patientName}
													</td>
													<AccessControl
														permission={PERMISSIONS.READ_ALL_APPOINTMENTS}
													>
														<td
															className="py-4"
															style={{
																fontSize: "15px",
																fontWeight: 600,
																color: "#00856F",
															}}
														>
															{appointment.doctorName}
														</td>
													</AccessControl>
													<td
														className="py-4"
														style={{
															fontSize: "15px",
															fontWeight: 600,
															color:
																appointment.type === "Video Call"
																	? "#00856F"
																	: "#37474F",
														}}
													>
														{appointment.type}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}

						<Button
							className="w-full mt-4"
							style={{
								background: "#00856F",
								color: "#FFFFFF",
								borderRadius: "24px",
								height: "44px",
								fontSize: "14px",
								fontWeight: 600,
							}}
							data-testid="button-view-all-appointments"
							onClick={handleViewAllAppointments}
						>
							View all Appointments
						</Button>
					</Card>

					{/* Bottom Row: Patient Alerts and Patients */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Patient Alerts */}
						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.08)",
							}}
							data-testid="card-patient-alerts"
						>
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<PatientAlertsIcon />
									<h3
										style={{
											fontSize: "18px",
											fontWeight: 700,
											color: "#00453A",
										}}
									>
										Patient Alerts
									</h3>
								</div>
								{isLoadingPatientAlers ? (
									<Loader2 className="h-8 w-8 animate-spin text-[#E53935]" />
								) : (
									<span
										style={{
											fontSize: "48px",
											fontWeight: 300,
											color: "#E53935",
										}}
										data-testid="text-alerts-count"
									>
										{String(alertsCount).padStart(2, "0")}
									</span>
								)}
							</div>

							{isLoadingPatientAlers ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
								</div>
							) : errorPatientAlerts ? (
								<div className="text-center py-12 text-red-500">
									Failed to load patient alerts. Please try again.
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full" data-testid="table-patient-alerts">
										<thead>
											<tr>
												<th
													className="text-left pb-4"
													style={{
														fontSize: "14px",
														fontWeight: 500,
														color: "#78909C",
													}}
												>
													Patient Name
												</th>
												<th
													className="text-left pb-4"
													style={{
														fontSize: "14px",
														fontWeight: 500,
														color: "#78909C",
													}}
												>
													Status
												</th>
											</tr>
										</thead>
										<tbody>
											{prioritizedAlerts.length === 0 ? (
												<tr>
													<td
														colSpan={2}
														className="py-8 text-center text-gray-500"
													>
														No patient alerts
													</td>
												</tr>
											) : (
												prioritizedAlerts.map((alert) => (
													<tr
														key={alert.id}
														className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
														onClick={() => handleViewPatientProfile(alert.id)}
														data-testid={`row-alert-${alert.id}`}
													>
														<td
															className="py-4"
															style={{
																fontSize: "15px",
																fontWeight: 600,
																color: "#00856F",
															}}
														>
															{alert.name}
														</td>
														<td className="py-4">
															<span
																className="px-3 py-1.5 rounded-full text-xs font-medium"
																style={{
																	...getStatusStyle(alert.status),
																	fontSize: "11px",
																	fontWeight: 500,
																}}
															>
																{getStatusDisplayText(alert.status)}
															</span>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							)}

							<Button
								className="w-full mt-4"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "24px",
									height: "44px",
									fontSize: "14px",
									fontWeight: 600,
								}}
								data-testid="button-view-all-alerts"
								onClick={handleViewAllAlerts}
							>
								View all Alerts
							</Button>
						</Card>

						{/* Patients */}
						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.08)",
							}}
							data-testid="card-patients"
						>
							<div className="flex items-center gap-3 mb-5">
								<PatientsIcon />
								<h3
									style={{
										fontSize: "18px",
										fontWeight: 700,
										color: "#00453A",
									}}
								>
									Patients
								</h3>
							</div>

							{isLoadingPatients ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
								</div>
							) : (
								<div className="space-y-3">
									{patients.length === 0 ? (
										<div className="text-center py-8 text-gray-500">
											No patients found
										</div>
									) : (
										patients.map((patient) => (
											<div
												key={patient.id}
												className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
												onClick={() => handleViewPatientProfile(patient.id)}
												data-testid={`row-patient-${patient.id}`}
											>
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10">
														<AvatarFallback
															style={{
																background: "#00856F",
																color: "#FFFFFF",
																fontSize: "14px",
																fontWeight: 600,
															}}
														>
															{patient.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<div>
														<p
															style={{
																fontSize: "14px",
																fontWeight: 600,
																color: "#00453A",
															}}
														>
															{patient.name}
														</p>
														<p
															style={{
																fontSize: "12px",
																fontWeight: 400,
																color: "#00856F",
															}}
														>
															Age : {patient.age}, {patient.condition}
														</p>
													</div>
												</div>
												<span
													className="px-3 py-1.5 rounded-full text-xs font-medium"
													style={{
														...getIndicationStyle(patient.indicationColor),
														fontSize: "11px",
														fontWeight: 500,
													}}
												>
													{patient.indication === "Needs Attention"
														? "Needs\nAttention"
														: patient.indication}
												</span>
											</div>
										))
									)}
								</div>
							)}

							<Button
								className="w-full mt-4"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "24px",
									height: "44px",
									fontSize: "14px",
									fontWeight: 600,
								}}
								data-testid="button-view-all-patients"
								onClick={handleViewAllPatients}
							>
								View all Patients
							</Button>
						</Card>
					</div>

					{/* Add Availability Button */}
					<Button
						className="w-full"
						style={{
							background: "#00856F",
							color: "#FFFFFF",
							borderRadius: "16px",
							height: "56px",
							fontSize: "16px",
							fontWeight: 600,
						}}
						onClick={() => navigate(ROUTES.DOCTOR_APPOINTMENTS)}
						data-testid="button-add-availability"
					>
						<Plus className="mr-2 h-5 w-5" />
						Add Availability
					</Button>
				</div>
			</main>
		</div>
	);
}
