import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { ChevronRight, Loader2 } from "lucide-react";
import { usePatientAlerts } from "@/hooks/mutations/usePatients";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { usePathname } from "wouter/use-browser-location";

interface PatientAlert {
	id: string;
	name: string;
	age: number;
	diabetesType: string;
	tags: Array<{ text: string; color: string }>;
	status: "High Risk" | "Stable" | "Needs Attention";
	statusColor: string;
}

function StatusCard({
	title,
	count,
	variant,
	color,
}: {
	title: string;
	count: number;
	variant: "high-risk" | "stable" | "needs-attention";
	color: string;
}) {
	// Convert hex color to rgba for background
	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const cardColors = {
		bg: hexToRgba(color, 0.08),
		border: color,
		text: color,
	};

	return (
		<Card
			className="p-6 text-center"
			style={{
				background: cardColors.bg,
				borderRadius: "16px",
				border: `2px solid ${cardColors.border}`,
			}}
			data-testid={`card-status-${variant}`}
		>
			<h3
				style={{
					fontSize: "18px",
					fontWeight: 600,
					color: cardColors.text,
					marginBottom: "8px",
				}}
			>
				{title}
			</h3>
			<p
				style={{
					fontSize: "48px",
					fontWeight: 300,
					color: cardColors.text,
					lineHeight: 1,
				}}
			>
				{count.toString().padStart(2, "0")}
			</p>
		</Card>
	);
}

function AlertTag({ text, color }: { text: string; color: string }) {
	// Convert hex color to rgba for background
	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	return (
		<span
			style={{
				display: "inline-block",
				padding: "4px 12px",
				borderRadius: "20px",
				fontSize: "11px",
				fontWeight: 500,
				background: hexToRgba(color, 0.1),
				color: color,
				whiteSpace: "nowrap",
			}}
		>
			{text}
		</span>
	);
}

function PatientAlertCard({
	patient,
	onClick,
}: {
	patient: PatientAlert;
	onClick: () => void;
}) {
	return (
		<Card
			className="p-4 cursor-pointer hover:shadow-md transition-shadow"
			style={{
				background: "#FFFFFF",
				borderRadius: "12px",
				border: "1px solid rgba(0, 0, 0, 0.06)",
			}}
			data-testid={`card-patient-alert-${patient.id}`}
			onClick={onClick}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1 min-w-0">
					<h4
						style={{
							fontSize: "16px",
							fontWeight: 600,
							color: "#00453A",
							marginBottom: "4px",
						}}
					>
						{patient.name}
					</h4>
					<p
						style={{
							fontSize: "13px",
							color: "#78909C",
							marginBottom: "12px",
						}}
					>
						Age : {patient.age},{" "}
						<span style={{ color: "#00856F" }}>{patient.diabetesType}</span>
					</p>
					<div className="flex flex-wrap gap-1.5">
						{patient.tags
							.filter((tag) => tag.text !== "No Alerts")
							.map((tag, index) => (
								<AlertTag key={index} text={tag.text} color={tag.color} />
							))}
					</div>
				</div>
				<ChevronRight
					size={20}
					color="#B0BEC5"
					className="flex-shrink-0 mt-2"
				/>
			</div>
		</Card>
	);
}

export function PatientAlerts() {
	const pathname = usePathname();
	const [, navigate] = useLocation();
	const { data: alertsData, isLoading, error } = usePatientAlerts();

	const highRiskPatients = alertsData?.highRisk || [];
	const stablePatients = alertsData?.stable || [];
	const needsAttentionPatients = alertsData?.needsAttention || [];

	const handlePatientClick = (patientId: string) => {
		const isAdmin = pathname.startsWith("/dashboard/admin");
		const route = isAdmin
			? ROUTES.ADMIN_PATIENT_PROFILE.replace(":profileId", patientId)
			: ROUTES.DOCTOR_PATIENT_PROFILE.replace(":profileId", patientId);
		navigate(route);
	};

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<main className="flex-1 p-6 lg:p-8 overflow-auto">
				<div className="max-w-6xl mx-auto">
					<h1
						style={{
							fontSize: "28px",
							fontWeight: 700,
							color: "#00453A",
							marginBottom: "32px",
						}}
						data-testid="text-patient-alerts-title"
					>
						Patient Alerts
					</h1>

					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
						</div>
					) : error ? (
						<div className="text-center py-12 text-red-500">
							Failed to load patient alerts. Please try again.
						</div>
					) : (
						<>
							<div className="grid grid-cols-3 gap-6 mb-8">
								<StatusCard
									title="High Risk"
									count={highRiskPatients.length}
									variant="high-risk"
									color={highRiskPatients[0]?.statusColor || "#FF6B6B"}
								/>
								<StatusCard
									title="Stable"
									count={stablePatients.length}
									variant="stable"
									color={stablePatients[0]?.statusColor || "#00856F"}
								/>
								<StatusCard
									title="Needs Attention"
									count={needsAttentionPatients.length}
									variant="needs-attention"
									color={needsAttentionPatients[0]?.statusColor || "#FFB74D"}
								/>
							</div>

							<div className="grid grid-cols-3 gap-6">
								<div className="space-y-4">
									{highRiskPatients.length === 0 ? (
										<Card
											className="p-4"
											style={{
												background: "#FFFFFF",
												borderRadius: "12px",
												border: "1px solid rgba(0, 0, 0, 0.06)",
											}}
										>
											<p
												style={{
													fontSize: "14px",
													color: "#78909C",
													textAlign: "center",
												}}
											>
												No high-risk patients
											</p>
										</Card>
									) : (
										highRiskPatients.map((patient) => (
											<PatientAlertCard
												key={patient.id}
												patient={patient}
												onClick={() => handlePatientClick(patient.id)}
											/>
										))
									)}
								</div>

								<div className="space-y-4">
									{stablePatients.length === 0 ? (
										<Card
											className="p-4"
											style={{
												background: "#FFFFFF",
												borderRadius: "12px",
												border: "1px solid rgba(0, 0, 0, 0.06)",
											}}
										>
											<p
												style={{
													fontSize: "14px",
													color: "#78909C",
													textAlign: "center",
												}}
											>
												No stable patients
											</p>
										</Card>
									) : (
										stablePatients.map((patient) => (
											<PatientAlertCard
												key={patient.id}
												patient={patient}
												onClick={() => handlePatientClick(patient.id)}
											/>
										))
									)}
								</div>

								<div className="space-y-4">
									{needsAttentionPatients.length === 0 ? (
										<Card
											className="p-4"
											style={{
												background: "#FFFFFF",
												borderRadius: "12px",
												border: "1px solid rgba(0, 0, 0, 0.06)",
											}}
										>
											<p
												style={{
													fontSize: "14px",
													color: "#78909C",
													textAlign: "center",
												}}
											>
												No patients needing attention
											</p>
										</Card>
									) : (
										needsAttentionPatients.map((patient) => (
											<PatientAlertCard
												key={patient.id}
												patient={patient}
												onClick={() => handlePatientClick(patient.id)}
											/>
										))
									)}
								</div>
							</div>
						</>
					)}
				</div>
			</main>
		</div>
	);
}
