import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePatientById } from "@/hooks/mutations/usePatients";
import { useRoute, useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import {
	Loader2,
	Check,
	X,
	Circle,
	Moon,
	ArrowLeft,
	ClipboardList,
	Calendar,
	StickyNote,
	FileText,
	Eye,
} from "lucide-react";
import {
	HealthTrendChart,
	type IntervalType,
	formatTimeLabel,
	getDateRange,
} from "../components/HealthTrendChart";
import { useMemo, useState } from "react";
import { formatDate, formatTime12 } from "@/lib/utils";
import type { UserConsultation } from "server/src/modules/booking/repository/booking.repository";
import type { PatientProfile as PatientProfileType } from "@/services/patientService";
import {
	useLabReportsByUserId,
	useViewLabReport,
	isImageFileName,
} from "@/hooks/mutations/useMedical";
import { LabReportImageLightbox } from "../components/LabReportImageLightbox";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import type { LabReport } from "@/services/medicalService";
import { REPORT_TYPES } from "../components/UploadMedicalReportsModal";
import { SoapNoteModal } from "./components/SoapNoteModal";
import { BOOKING_STATUS_ENUM } from "@shared/schema";
import { consultations } from "@/mocks/medicalRecords";

const DOCUMENTS_PAGE_SIZE = 10;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getAlertStyle(alertColor: string) {
	const hexToRgba = (hex: string, alpha: number) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};
	return {
		background: hexToRgba(alertColor, 0.1),
		color: alertColor,
		border: `1px solid ${hexToRgba(alertColor, 0.3)}`,
	};
}

function getWeekDates(): Array<{
	label: string;
	dateStr: string;
	isPast: boolean;
	isToday: boolean;
}> {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const result: Array<{
		label: string;
		dateStr: string;
		isPast: boolean;
		isToday: boolean;
	}> = [];
	for (let i = -6; i <= 0; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() + i);
		const dateStr = d.toISOString().split("T")[0];
		const dayIdx = (d.getDay() + 6) % 7;
		result.push({
			label: WEEKDAYS[dayIdx],
			dateStr,
			isPast: i < 0,
			isToday: i === 0,
		});
	}
	return result;
}

function formatDob(birthday: string): string {
	if (!birthday) return "—";
	const d = new Date(birthday);
	return formatDate(d, "MM-dd-yyyy");
}

export function PatientProfile() {
	const [, navigate] = useLocation();
	const [matchDoctor, paramsDoctor] = useRoute<{ profileId: string }>(
		ROUTES.DOCTOR_PATIENT_PROFILE,
	);
	const [matchAdmin, paramsAdmin] = useRoute<{ profileId: string }>(
		ROUTES.ADMIN_PATIENT_PROFILE,
	);
	const [glucoseInterval, setGlucoseInterval] = useState<IntervalType>("weekly");
	const [hba1cInterval, setHba1cInterval] = useState<IntervalType>("weekly");
	const [isAllSummariesDialogOpen, setIsAllSummariesDialogOpen] = useState(false);
	const glucoseDateRange = getDateRange(glucoseInterval);
	const hba1cDateRange = getDateRange(hba1cInterval);
	const isAdmin = !!matchAdmin;

	const patientId =
		(matchDoctor ? paramsDoctor?.profileId : paramsAdmin?.profileId) || null;
	const { data: patient, isLoading, error, refetch: refetchPatient } =
		usePatientById(patientId, glucoseDateRange);

	const glucoseData = useMemo(() => {
		if (!patient?.glucoseTrend || patient.glucoseTrend.length === 0) return [];
		return [...patient.glucoseTrend].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, glucoseInterval),
				value:
					typeof m.value === "string" ? parseFloat(m.value) : m.value || 0,
			};
		});
	}, [patient?.glucoseTrend, glucoseInterval]);

	const hba1cData = useMemo(() => {
		if (!patient?.hba1cTrend || patient.hba1cTrend.length === 0) return [];
		return patient.hba1cTrend.map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, hba1cInterval),
				value: m.value,
			};
		});
	}, [patient?.hba1cTrend, hba1cInterval]);

	const exerciseWeekData = useMemo(() => {
		const weekDates = getWeekDates();
		const logMap = new Map<string, { exercise: string | null }>();
		(patient?.quickLogsWeek ?? []).forEach((q) => {
			logMap.set(q.logDate, { exercise: q.exercise });
		});
		return weekDates.map(({ label, dateStr, isPast, isToday }) => {
			const log = logMap.get(dateStr);
			const didExercise = log?.exercise && log.exercise !== "none";
			let icon: "tick" | "cross" | "neutral" = "neutral";
			if (isPast) {
				icon = didExercise ? "tick" : "cross";
			} else if (isToday) {
				icon = didExercise ? "tick" : "neutral";
			}
			return { label, icon };
		});
	}, [patient?.quickLogsWeek]);

	const sleepChartData = useMemo(() => {
		const byDay = patient?.sleepPattern?.byDay ?? [];
		if (byDay.length === 0) return [];
		return byDay.map((d) => {
			const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
			const dayName = dayNames[new Date(d.day).getDay()];
			return { time: dayName, value: d.hours };
		});
	}, [patient?.sleepPattern]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen bg-[#F7F9F9]">
				<Sidebar />
				<main className="flex-1 p-6 lg:p-8 overflow-auto">
					<div className="max-w-5xl mx-auto flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-[#00856F]" />
					</div>
				</main>
			</div>
		);
	}

	if (error || !patient) {
		return (
			<div className="flex min-h-screen bg-[#F7F9F9]">
				<Sidebar />
				<main className="flex-1 p-6 lg:p-8 overflow-auto">
					<div className="max-w-5xl mx-auto text-center py-12 text-red-500">
						Failed to load patient profile. Please try again.
					</div>
				</main>
			</div>
		);
	}

	const dietTrend = patient.dietTrend;
	const macros = patient.macros;
	const recommendedTotal = Math.round(
		dietTrend?.avgRecommendedCalories ?? 0,
	);
	const totalLogged = dietTrend?.totalLogged ?? 0;
	const exceeded =
		totalLogged > recommendedTotal ? totalLogged - recommendedTotal : 0;

	const backHref = isAdmin ? ROUTES.ADMIN_PATIENTS : ROUTES.DOCTOR_PATIENTS;
	const initials = patient.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="flex min-h-screen bg-[#F7F9F9]">
			<Sidebar />

			<main className="flex-1 p-4 lg:p-8 overflow-auto w-full">
				<div className="w-full max-w-5xl mx-auto space-y-6">
					{/* Back */}
					<button
						type="button"
						onClick={() => navigate(backHref)}
						className="flex items-center gap-2 text-[#475569] hover:text-[#00856F] transition-colors text-sm font-medium"
						data-testid="button-back"
					>
						<ArrowLeft className="w-4 h-4" />
						Back
					</button>

					{/* Header: Avatar, name, demographics, badges */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-5 lg:px-6 lg:py-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
						<div className="flex items-center gap-4 flex-1 min-w-0">
							<div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-lg bg-[#00856F] shadow-sm">
								{initials}
							</div>
							<div className="min-w-0">
								<h1
									className="text-xl lg:text-2xl font-semibold text-[#0f172a] tracking-tight truncate"
									data-testid="text-patient-name"
								>
									{patient.name}
								</h1>
								<p className="text-sm text-[#64748b] mt-0.5">
									{patient.gender || "—"} · DOB {formatDob(patient.birthday)}
								</p>
							</div>
						</div>
						<span
							className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white shadow-sm"
							style={{ background: patient.riskLevelColor }}
							data-testid="badge-risk-level"
						>
							{patient.riskLevel}
						</span>
					</div>

					{/* Tabs */}
					<Tabs defaultValue="overview" className="w-full">
						<TabsList className="w-full h-auto flex flex-wrap sm:flex-nowrap gap-1 p-1.5 bg-white border border-[#e2e8f0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-x-auto">
							<TabsTrigger
								value="overview"
								className="flex-1 min-w-[110px] py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-[#00856F] data-[state=active]:text-white data-[state=inactive]:text-[#64748b] hover:text-[#0f172a] transition-colors"
							>
								<ClipboardList className="w-4 h-4 mr-2 shrink-0 opacity-80" />
								Overview
							</TabsTrigger>
							<TabsTrigger
								value="appointments"
								className="flex-1 min-w-[110px] py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-[#00856F] data-[state=active]:text-white data-[state=inactive]:text-[#64748b] hover:text-[#0f172a] transition-colors"
							>
								<Calendar className="w-4 h-4 mr-2 shrink-0 opacity-80" />
								Appointments
							</TabsTrigger>
							<TabsTrigger
								value="notes"
								className="flex-1 min-w-[110px] py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-[#00856F] data-[state=active]:text-white data-[state=inactive]:text-[#64748b] hover:text-[#0f172a] transition-colors"
							>
								<StickyNote className="w-4 h-4 mr-2 shrink-0 opacity-80" />
								Notes
							</TabsTrigger>
							<TabsTrigger
								value="documents"
								className="flex-1 min-w-[110px] py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-[#00856F] data-[state=active]:text-white data-[state=inactive]:text-[#64748b] hover:text-[#0f172a] transition-colors"
							>
								<FileText className="w-4 h-4 mr-2 shrink-0 opacity-80" />
								Documents
							</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent value="overview" className="mt-6 space-y-6">
							<OverviewTab
								patient={patient}
								patientId={patientId}
								isAdmin={isAdmin}
								glucoseData={glucoseData}
								hba1cData={hba1cData}
								glucoseInterval={glucoseInterval}
								setGlucoseInterval={setGlucoseInterval}
								hba1cInterval={hba1cInterval}
								setHba1cInterval={setHba1cInterval}
								exerciseWeekData={exerciseWeekData}
								sleepChartData={sleepChartData}
								dietTrend={dietTrend}
								macros={macros}
								recommendedTotal={recommendedTotal}
								totalLogged={totalLogged}
								exceeded={exceeded}
							/>
						</TabsContent>

						{/* Appointments Tab */}
						<TabsContent value="appointments" className="mt-6">
							<AppointmentsTab patient={patient} />
						</TabsContent>

						{/* Notes Tab */}
						<TabsContent value="notes" className="mt-6">
							<NotesTab
								patient={patient}
								isAdmin={isAdmin}
								onSeeAllSummaries={() => setIsAllSummariesDialogOpen(true)}
								onRefetchPatient={refetchPatient}
							/>
						</TabsContent>

						{/* Documents Tab */}
						<TabsContent value="documents" className="mt-6">
							<DocumentsTab patientId={patientId} />
						</TabsContent>
					</Tabs>
				</div>
			</main>

			<Dialog
				open={isAllSummariesDialogOpen}
				onOpenChange={setIsAllSummariesDialogOpen}
			>
				<DialogContent className="max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-[#00453A] font-bold">
							All Consultation Summaries
						</DialogTitle>
					</DialogHeader>
					<div className="overflow-y-auto flex-1 pr-2">
						{patient.consultationSummaries &&
							patient.consultationSummaries.length > 0 ? (
							<ul className="space-y-4">
								{patient.consultationSummaries.map((summary, index) => (
									<li
										key={index}
										className="flex items-start gap-3 pb-4 border-b border-black/5 last:border-0"
									>
										<div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#00856F]" />
										<div className="min-w-0 flex-1">
											<p className="text-sm text-[#546E7A] leading-relaxed">
												{summary.summary}
											</p>
											<div className="flex items-center gap-2 flex-wrap mt-2">
												<span className="text-xs text-[#78909C]">
													{formatDate(new Date(summary.date), "MMM dd, yyyy")}
												</span>
												{isAdmin && summary.physicianName && (
													<>
														<span className="text-xs text-[#78909C]">•</span>
														<span className="text-xs font-medium text-[#00856F]">
															Dr. {summary.physicianName}
														</span>
													</>
												)}
											</div>
										</div>
									</li>
								))}
							</ul>
						) : (
							<div className="text-center py-10 text-[#78909C] text-sm">
								No consultation summaries available yet.
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

/* ---------- Overview Tab ---------- */
function OverviewTab({
	patient,
	patientId,
	isAdmin,
	glucoseData,
	hba1cData,
	glucoseInterval,
	setGlucoseInterval,
	hba1cInterval,
	setHba1cInterval,
	exerciseWeekData,
	sleepChartData,
	dietTrend,
	macros,
	recommendedTotal,
	totalLogged,
	exceeded,
}: {
	patient: PatientProfileType;
	patientId: string | null;
	isAdmin: boolean;
	glucoseData: { time: string; value: number }[];
	hba1cData: { time: string; value: number }[];
	glucoseInterval: IntervalType;
	setGlucoseInterval: (v: IntervalType) => void;
	hba1cInterval: IntervalType;
	setHba1cInterval: (v: IntervalType) => void;
	exerciseWeekData: { label: string; icon: "tick" | "cross" | "neutral" }[];
	sleepChartData: { time: string; value: number }[];
	dietTrend: PatientProfileType["dietTrend"];
	macros: PatientProfileType["macros"];
	recommendedTotal: number;
	totalLogged: number;
	exceeded: number;
}) {
	return (
		<div className="space-y-5">
			{/* Patient Information + Alerts */}
			<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
					Patient Information
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
					<div>
						<p className="text-xs text-[#94a3b8] mb-0.5">Contact</p>
						<p className="text-sm font-medium text-[#0f172a]">{patient.email || "—"}</p>
					</div>
					<div>
						<p className="text-xs text-[#94a3b8] mb-0.5">Address</p>
						<p className="text-sm text-[#64748b]">No address on file</p>
					</div>
				</div>
				{patient.alerts && patient.alerts.length > 0 && (
					<div className="mt-4 pt-4 border-t border-[#e2e8f0]">
						<p className="text-xs text-[#94a3b8] mb-2">Alerts</p>
						<div className="flex flex-wrap gap-2">
							{patient.alerts.map((alert, i) => (
								<span
									key={i}
									className="px-2.5 py-1 rounded-md text-xs font-medium"
									style={getAlertStyle(alert.color)}
								>
									{alert.text}
								</span>
							))}
						</div>
					</div>
				)}
			</Card>

			{/* Glucose Summary */}
			<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]" data-testid="card-glucose-summary">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
					Glucose Summary
				</h3>
				<div className="grid grid-cols-3 gap-6">
					<div className="text-center">
						<p className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-1">Highs</p>
						<p className="text-2xl font-semibold tabular-nums text-[#00856F]" data-testid="text-highs">
							{patient.glucoseSummary?.highs ?? 0}%
						</p>
					</div>
					<div className="text-center border-x border-[#e2e8f0]">
						<p className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-1">Lows</p>
						<p className="text-2xl font-semibold tabular-nums text-[#00856F]" data-testid="text-lows">
							{patient.glucoseSummary?.lows ?? 0}%
						</p>
					</div>
					<div className="text-center">
						<p className="text-[11px] uppercase tracking-wider text-[#94a3b8] mb-1">Time in range</p>
						<p className="text-2xl font-semibold tabular-nums text-[#00856F]" data-testid="text-time-in-range">
							{patient.glucoseSummary?.timeInRange ?? 0}%
						</p>
					</div>
				</div>
			</Card>

			{/* HbA1c Trend */}
			<HealthTrendChart
				title="HbA1c Trend"
				data={hba1cData}
				gradientId="hba1cGradient"
				testId="card-hba1c-trend"
				height={250}
				yAxisConfig={{
					domain: [0, 10],
					ticks: [0, 2, 4, 6, 8, 10],
				}}
				interval={hba1cInterval}
				onIntervalChange={setHba1cInterval}
			/>

			{/* Glucose Trend */}
			<HealthTrendChart
				title="Glucose Trend"
				data={glucoseData}
				gradientId="glucoseGradient"
				testId="card-glucose-trend"
				height={250}
				yAxisConfig={{
					domain: [0, 200],
					ticks: [70, 80, 90, 100, 120],
				}}
				interval={glucoseInterval}
				onIntervalChange={setGlucoseInterval}
			/>

			{/* Weekly Exercise — minimal strip */}
			<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
					Exercise this week
				</h3>
				<div className="flex items-center justify-between gap-1">
					{exerciseWeekData.map(({ label, icon }) => (
						<div
							key={label}
							className="flex flex-1 flex-col items-center gap-1.5 py-2"
							title={label}
						>
							<span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider hidden sm:block">
								{label}
							</span>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${icon === "tick"
									? "bg-[#00856F]/12 text-[#00856F]"
									: icon === "cross"
										? "bg-red-500/10 text-red-500"
										: "bg-[#f1f5f9] text-[#94a3b8]"
									}`}
							>
								{icon === "tick" && <Check className="w-4 h-4" strokeWidth={2.5} />}
								{icon === "cross" && <X className="w-4 h-4" strokeWidth={2.5} />}
								{icon === "neutral" && <Circle className="w-3 h-3" strokeWidth={2} />}
							</div>
						</div>
					))}
				</div>
			</Card>

			{/* Diet & nutrition — single compact card */}
			<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
					Nutrition (7 days)
				</h3>
				<div className="space-y-4">
					<div>
						<div className="flex justify-between text-xs mb-1.5">
							<span className="text-[#64748b]">Calories</span>
							<span className="font-medium text-[#0f172a] tabular-nums">
								{totalLogged} / {recommendedTotal} kcal
								{exceeded > 0 && (
									<span className="text-red-500 font-normal ml-1">+{exceeded} over</span>
								)}
							</span>
						</div>
						<div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden flex">
							<div
								className="h-full rounded-l-full bg-[#00856F]/80 transition-all duration-300"
								style={{
									width: `${Math.min(
										100,
										recommendedTotal > 0 ? (totalLogged / recommendedTotal) * 100 : 0,
									)}%`,
								}}
							/>
							{exceeded > 0 && (
								<div
									className="h-full flex-shrink-0 bg-red-400/80"
									style={{
										width: `${Math.min(
											100,
											recommendedTotal > 0 ? (exceeded / recommendedTotal) * 100 : 0,
										)}%`,
									}}
								/>
							)}
						</div>
					</div>
					<div className="flex items-center gap-6 text-sm text-[#64748b]">
						<span>Carbs <strong className="text-[#0f172a] font-medium">{macros?.carbsPercent ?? 0}%</strong></span>
						<span>Protein <strong className="text-[#0f172a] font-medium">{macros?.proteinPercent ?? 0}%</strong></span>
						<span>Fat <strong className="text-[#0f172a] font-medium">{macros?.fatPercent ?? 0}%</strong></span>
					</div>
				</div>
			</Card>

			{/* Sleep Pattern */}
			{(patient.sleepPattern?.byDay?.length ?? 0) > 0 && (
				<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
					<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-4">
						Sleep pattern
					</h3>
					<HealthTrendChart
						title=""
						data={sleepChartData}
						gradientId="sleepGradient"
						testId="card-sleep-trend"
						height={200}
						yAxisConfig={{
							domain: [0, 10],
							ticks: [0, 4, 6, 8, 10],
						}}
					/>
					<div className="flex items-center gap-2 mt-3 text-sm text-[#64748b]">
						<Moon className="w-4 h-4 text-[#00856F]" />
						<span>Quality: {patient.sleepPattern?.avgQuality ?? "—"}</span>
					</div>
				</Card>
			)}
		</div>
	);
}

/* ---------- Appointments Tab ---------- */
function formatAppointmentDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${m}-${day}-${y}`;
}

function formatAppointmentTimeRange(startTime: string, endTime: string): string {
	return `${formatTime12(startTime)} - ${formatTime12(endTime)}`;
}

function getAppointmentTypeLabel(apt: UserConsultation): string {
	const typeName = apt.slot?.slotType?.type;
	if (typeName) {
		return typeName.charAt(0).toUpperCase() + typeName.slice(1);
	}
	return "Consultation";
}


function AppointmentCard({ apt }: { apt: UserConsultation }) {
	const slot = apt.slot;
	const date = slot?.availability?.date
		? new Date(slot.availability.date)
		: null;
	const dateStr = date ? formatAppointmentDate(date) : "—";
	const timeStr =
		slot?.startTime && slot?.endTime
			? formatAppointmentTimeRange(slot.startTime, slot.endTime)
			: "—";
	const typeLabel = getAppointmentTypeLabel(apt);
	const physician = slot?.physician;
	const physicianName =
		physician?.firstName && physician?.lastName
			? `${physician.firstName} ${physician.lastName}`
			: null;
	const location = slot?.location;
	const hasLocation = location?.locationName || location?.address;
	const locationLine = [
		location?.address,
		location?.city,
		location?.state,
		location?.postalCode,
	]
		.filter(Boolean)
		.join(", ");

	return (
		<div
			className="p-4 rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
			data-testid="appointment-card"
		>
			<span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white bg-[#00856F] mb-3">
				{typeLabel}
			</span>
			<p className="text-sm font-medium text-[#0f172a] mb-1.5">
				{dateStr} · {timeStr}
			</p>
			{(hasLocation || physicianName) && (
				<p className="text-xs text-[#64748b]">
					{hasLocation && location?.locationName && `Center: ${location.locationName}`}
					{hasLocation && locationLine && (location?.locationName ? ` · ${locationLine}` : `Location: ${locationLine}`)}
					{!hasLocation && physicianName && `Physician: ${physicianName}`}
				</p>
			)}
		</div>
	);
}

function AppointmentsTab({ patient }: { patient: PatientProfileType }) {
	const past = patient.appointments
	const upcoming = patient.upcomingAppointments

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
					Upcoming
				</h3>
				{upcoming.length === 0 ? (
					<Card className="p-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
						<p className="text-center text-[#94a3b8] text-sm">No upcoming appointments.</p>
					</Card>
				) : (
					<div className="space-y-2">
						{upcoming.map((apt) => (
							<AppointmentCard key={apt.id} apt={apt} />
						))}
					</div>
				)}
			</div>
			<div>
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
					Past
				</h3>
				{past.length === 0 ? (
					<Card className="p-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
						<p className="text-center text-[#94a3b8] text-sm">No past appointments.</p>
					</Card>
				) : (
					<div className="space-y-2">
						{past.map((apt) => (
							<AppointmentCard key={apt.id} apt={apt} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}


function NotesTab({
	patient,
	isAdmin,
	onSeeAllSummaries,
	onRefetchPatient,
}: {
	patient: PatientProfileType;
	isAdmin: boolean;
	onSeeAllSummaries: () => void;
	onRefetchPatient?: () => void;
}) {
	const appointments = patient.appointments ?? []
	const completedConsultations = appointments

	const [soapNoteConsultation, setSoapNoteConsultation] =
		useState<UserConsultation | null>(null);
	const [soapNoteOpen, setSoapNoteOpen] = useState(false);

	const handleOpenSoapNote = (consultation: UserConsultation) => {
		setSoapNoteConsultation(consultation);
		setSoapNoteOpen(true);
	};

	const handleCloseSoapNote = (open: boolean) => {
		setSoapNoteOpen(open);
		if (!open) setSoapNoteConsultation(null);
	};

	return (
		<>
			<Card
				className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
				data-testid="card-recent-notes"
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
						Notes
					</h3>
				</div>
				{completedConsultations.length === 0 ? (
					<div className="text-center py-12 text-[#94a3b8] text-sm">
						No completed consultations yet. Notes are available for completed
						consultations.
					</div>
				) : (
					<ul className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
						{completedConsultations.map((consultation) => {
							const physicianName = `${consultation.slot.physician.firstName} ${consultation.slot.physician.lastName}`;
							const dateStr = consultation.slot.availability.date;
							const summaryPreview = consultation.summary
								? consultation.summary.slice(0, 120) +
								(consultation.summary.length > 120 ? "…" : "")
								: "No summary yet";
							return (
								<li
									key={consultation.id}
									className="flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-1 hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0]"
									onClick={() => handleOpenSoapNote(consultation)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											handleOpenSoapNote(consultation);
										}
									}}
									data-testid={`note-item-${consultation.id}`}
								>
									<div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-[#00856F]" />
									<div className="min-w-0 flex-1">
										<span className="text-sm text-[#475569] leading-snug block">
											{summaryPreview}
										</span>
										<div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-[#94a3b8]">
											<span>
												{formatDate(
													new Date(typeof dateStr === "string" ? dateStr : (dateStr as Date)),
													"MMM d, yyyy",
												)}
											</span>
											<span>·</span>
											<span className="font-medium text-[#00856F]">
												Dr. {physicianName}
											</span>
										</div>
										<span className="text-xs text-[#475569] leading-snug blockm mt-1.5 ">
											<span className=" text-[#94a3b8] ">Start Time:</span> {formatTime12(consultation.slot.startTime)}
										</span>
									</div>
								</li>
							);
						})}
					</ul>
				)}

			</Card>

			<SoapNoteModal
				open={soapNoteOpen}
				onOpenChange={handleCloseSoapNote}
				consultation={soapNoteConsultation}
				patientName={patient.name}
				patientMrn={patient.id ?? "—"}
				onSaved={onRefetchPatient}
			/>
		</>
	);
}

/* ---------- Documents Tab (lab reports from existing API; view only) ---------- */
const REPORT_TYPE_VALUES = REPORT_TYPES.map((t) => t.value);
type ReportTypeFilter = "all" | (typeof REPORT_TYPE_VALUES)[number];

function normalizeReportType(reportType: string | null | undefined): string {
	if (!reportType) return "other";
	return REPORT_TYPE_VALUES.includes(reportType) ? reportType : "other";
}

function getReportTypeLabel(type: string | null | undefined): string {
	const normalized = normalizeReportType(type);
	return REPORT_TYPES.find((t) => t.value === normalized)?.label ?? "Other";
}

function DocumentsTab({ patientId }: { patientId: string | null }) {
	const [category, setCategory] = useState<ReportTypeFilter>("all");
	const [page, setPage] = useState(1);
	const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

	const { data, isLoading } = useLabReportsByUserId(patientId, {
		limit: DOCUMENTS_PAGE_SIZE,
		offset: (page - 1) * DOCUMENTS_PAGE_SIZE,
	});
	const viewMutation = useViewLabReport();

	const allReports = data?.reports ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / DOCUMENTS_PAGE_SIZE) || 1;

	const reportsToShow =
		category === "all"
			? allReports
			: allReports.filter((r) => normalizeReportType(r.reportType) === category);

	const getCount = (filter: ReportTypeFilter) =>
		filter === "all"
			? total
			: allReports.filter((r) => normalizeReportType(r.reportType) === filter).length;

	const handleViewReport = (report: LabReport) => {
		viewMutation.mutate(
			{
				reportId: report.id,
				fileName: report.fileName,
				forUserId: patientId ?? undefined,
			},
			{
				onSuccess: (data) => {
					if (!data.isPdf && isImageFileName(report.fileName)) {
						setImageViewerUrl(data.url);
					}
				},
			},
		);
	};

	const closeImageViewer = () => {
		if (imageViewerUrl) {
			URL.revokeObjectURL(imageViewerUrl);
			setImageViewerUrl(null);
		}
	};

	if (!patientId) {
		return (
			<Card className="p-8 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
				<p className="text-center text-[#94a3b8] text-sm">Select a patient.</p>
			</Card>
		);
	}

	return (
		<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="flex flex-wrap gap-2 mb-4">
				<button
					type="button"
					onClick={() => { setCategory("all"); setPage(1); }}
					className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${category === "all"
						? "bg-[#00856F] text-white"
						: "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
						}`}
				>
					All ({getCount("all")})
				</button>
				{REPORT_TYPES.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => { setCategory(t.value as ReportTypeFilter); setPage(1); }}
						className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${category === t.value
							? "bg-[#00856F] text-white"
							: "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
							}`}
					>
						{t.label} ({getCount(t.value as ReportTypeFilter)})
					</button>
				))}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-14">
					<Loader2 className="w-7 h-7 animate-spin text-[#00856F]" />
				</div>
			) : reportsToShow.length === 0 ? (
				<div
					className="py-14 text-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc]"
					data-testid="documents-empty"
				>
					<p className="text-[#94a3b8] text-sm">No records found</p>
				</div>
			) : (
				<>
					<div className="overflow-x-auto -mx-5 px-5 lg:-mx-6 lg:px-6">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-[#e2e8f0]">
									<th className="text-left py-3 px-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
										Document
									</th>
									<th className="text-left py-3 px-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
										Category
									</th>
									<th className="text-left py-3 px-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
										Document Date
									</th>
									<th className="text-left py-3 px-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
										Upload Date
									</th>
									<th className="text-right py-3 px-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
										Action
									</th>
								</tr>
							</thead>
							<tbody>
								{reportsToShow.map((report) => (
									<tr
										key={report.id}
										className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
									>
										<td className="py-3 px-3 text-sm font-medium text-[#0f172a]">
											{report.reportName || report.fileName}
										</td>
										<td className="py-3 px-3 text-sm text-[#64748b]">
											{getReportTypeLabel(report.reportType)}
										</td>
										<td className="py-3 px-3 text-sm text-[#64748b] tabular-nums">
											{report.dateOfReport
												? formatDate(new Date(report.dateOfReport), "MMM d, yyyy")
												: "—"}
										</td>
										<td className="py-3 px-3 text-sm text-[#64748b] tabular-nums">
											{formatDate(new Date(report.uploadedAt), "MMM d, yyyy")}
										</td>
										<td className="py-3 px-3 text-right">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleViewReport(report)}
												disabled={viewMutation.isPending}
												className="h-8 px-3 text-xs font-medium border-[#e2e8f0] text-[#00856F] hover:bg-[#00856F]/10 rounded-lg"
											>
												<Eye className="w-3.5 h-3.5 mr-1.5 inline" />
												View
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{category === "all" && totalPages > 1 && (
						<div className="mt-4 pt-4 border-t border-[#e2e8f0]">
							<ReusablePagination
								currentPage={page}
								totalPages={totalPages}
								onPageChange={setPage}
							/>
						</div>
					)}
				</>
			)}

			{imageViewerUrl && (
				<LabReportImageLightbox
					open={!!imageViewerUrl}
					onClose={closeImageViewer}
					src={imageViewerUrl}
				/>
			)}
		</Card>
	);
}
