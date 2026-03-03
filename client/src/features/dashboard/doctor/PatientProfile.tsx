import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePatientById } from "@/hooks/mutations/usePatients";
import { useRoute } from "wouter";
import { ROUTES } from "@/config/routes";
import { Loader2, Check, X, Circle, Moon } from "lucide-react";
import {
	HealthTrendChart,
	type IntervalType,
	formatTimeLabel,
	getDateRange,
} from "../components/HealthTrendChart";
import { useMemo, useState } from "react";
import { formatDate } from "@/lib/utils";
import { PatientLabReportsModal } from "../components/PatientLabReportsModal";

function ClipboardIcon() {
	return (
		<svg width="24" height="28" viewBox="0 0 24 28" fill="none">
			<rect x="2" y="4" width="20" height="22" rx="3" fill="#00856F" />
			<rect x="6" y="2" width="12" height="4" rx="1" fill="#B2DFDB" />
		</svg>
	);
}

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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): Array<{ label: string; dateStr: string; isPast: boolean; isToday: boolean }> {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = today.toISOString().split("T")[0];
	const result: Array<{ label: string; dateStr: string; isPast: boolean; isToday: boolean }> = [];
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

export function PatientProfile() {
	const [matchDoctor, paramsDoctor] = useRoute<{ profileId: string }>(
		ROUTES.DOCTOR_PATIENT_PROFILE,
	);
	const [matchAdmin, paramsAdmin] = useRoute<{ profileId: string }>(
		ROUTES.ADMIN_PATIENT_PROFILE,
	);
	const [glucoseInterval, setGlucoseInterval] = useState<IntervalType>("weekly");
	const [hba1cInterval, setHba1cInterval] = useState<IntervalType>("weekly");
	const [isAllSummariesDialogOpen, setIsAllSummariesDialogOpen] = useState(false);
	const [medicalReportsOpen, setMedicalReportsOpen] = useState(false);
	const glucoseDateRange = getDateRange(glucoseInterval);
	const hba1cDateRange = getDateRange(hba1cInterval);
	const isAdmin = !!matchAdmin;

	const patientId =
		(matchDoctor ? paramsDoctor?.profileId : paramsAdmin?.profileId) || null;
	const { data: patient, isLoading, error } = usePatientById(
		patientId,
		glucoseDateRange,
	);

	const glucoseData = useMemo(() => {
		if (!patient?.glucoseTrend || patient.glucoseTrend.length === 0) return [];
		return [...patient.glucoseTrend].reverse().map((m) => {
			const date = new Date(m.recordedAt);
			return {
				time: formatTimeLabel(date, glucoseInterval),
				value: typeof m.value === "string" ? parseFloat(m.value) : m.value || 0,
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
			const didExercise =
				log?.exercise && log.exercise !== "none";
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
			<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
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
			<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
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
		(dietTrend?.avgRecommendedCalories ?? 0),
	);
	const totalLogged = dietTrend?.totalLogged ?? 0;
	const exceeded = totalLogged > recommendedTotal ? totalLogged - recommendedTotal : 0;

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 p-4 lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6 max-w-5xl mx-auto">
					<h1
						style={{
							fontSize: "28px",
							fontWeight: 700,
							color: "#00453A",
							marginBottom: "24px",
						}}
						data-testid="text-patient-profile-title"
					>
						Patient Profile
					</h1>

					{/* Patient header: Name, Age, Risk + Latest Sugar + Diagnosis + Medical Reports */}
					<Card
						className="p-6"
						style={{
							background: "#FFFFFF",
							borderRadius: "16px",
							border: "1px solid rgba(0, 0, 0, 0.08)",
						}}
						data-testid="card-patient-info"
					>
						<div className="flex flex-wrap items-start justify-between gap-4 mb-4">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h2
										style={{
											fontSize: "24px",
											fontWeight: 700,
											color: "#00453A",
										}}
										data-testid="text-patient-name"
									>
										{patient.name}
									</h2>
									<span
										className="px-4 py-1.5 rounded-full text-sm font-medium"
										style={{
											background: patient.riskLevelColor,
											color: "#FFFFFF",
										}}
										data-testid="badge-risk-level"
									>
										{patient.riskLevel}
									</span>
								</div>
								<p
									style={{
										fontSize: "14px",
										fontWeight: 400,
										color: "#00856F",
									}}
									data-testid="text-patient-details"
								>
									Age: {patient.age}
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
							<div
								className="p-4 rounded-xl"
								style={{
									background: "#E0F2F1",
									border: "1px solid rgba(0, 133, 111, 0.2)",
								}}
							>
								<p
									style={{
										fontSize: "12px",
										fontWeight: 500,
										color: "#78909C",
										marginBottom: "4px",
									}}
								>
									Latest Sugar
								</p>
								<p
									style={{
										fontSize: "24px",
										fontWeight: 700,
										color: "#00856F",
									}}
								>
									{patient.latestBloodGlucose != null
										? `${patient.latestBloodGlucose} mg/dL`
										: "—"}
								</p>
							</div>
							<div
								className="p-4 rounded-xl"
								style={{
									background: "#E0F2F1",
									border: "1px solid rgba(0, 133, 111, 0.2)",
								}}
							>
								<p
									style={{
										fontSize: "12px",
										fontWeight: 500,
										color: "#78909C",
										marginBottom: "4px",
									}}
								>
									Diagnosis Status
								</p>
								<p
									style={{
										fontSize: "16px",
										fontWeight: 600,
										color: "#00453A",
									}}
								>
									{patient.condition}
								</p>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<span
								style={{
									fontSize: "14px",
									fontWeight: 500,
									color: "#546E7A",
								}}
							>
								Medical Reports
							</span>
							<Button
								onClick={() => setMedicalReportsOpen(true)}
								size="sm"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								View Reports
							</Button>
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

					{/* Exercise this Week - layout like image: 4+3 grid */}
					<Card
						className="p-6"
						style={{
							background: "#FFFFFF",
							borderRadius: "16px",
							border: "1px solid rgba(0, 0, 0, 0.08)",
							boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
						}}
					>
						<h3
							style={{
								fontSize: "18px",
								fontWeight: 700,
								color: "#00453A",
								marginBottom: "20px",
							}}
						>
							Exercise this Week
						</h3>
						<div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
							{exerciseWeekData.map(({ label, icon }) => (
								<div
									key={label}
									className="flex flex-col items-center justify-center p-4 rounded-xl border min-h-[80px]"
									style={{
										background: "#FFFFFF",
										borderColor: "rgba(0, 133, 111, 0.2)",
										boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
									}}
								>
									<div className="flex items-center gap-2 w-full justify-center">
										<span
											style={{
												fontSize: "14px",
												fontWeight: 600,
												color: "#00453A",
											}}
										>
											{label}
										</span>
										{icon === "tick" && (
											<Check
												className="w-5 h-5 flex-shrink-0"
												style={{ color: "#00856F" }}
											/>
										)}
										{icon === "cross" && (
											<X
												className="w-5 h-5 flex-shrink-0"
												style={{ color: "#D32F2F" }}
											/>
										)}
										{icon === "neutral" && (
											<Circle
												className="w-5 h-5 flex-shrink-0"
												style={{ color: "#BDBDBD" }}
											/>
										)}
									</div>
								</div>
							))}
						</div>
					</Card>

					{/* Diet Trend - 7 Days */}
					<Card
						className="p-6"
						style={{
							background: "#FFFFFF",
							borderRadius: "16px",
							border: "1px solid rgba(0, 0, 0, 0.08)",
							boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
						}}
					>
						<h3
							style={{
								fontSize: "18px",
								fontWeight: 700,
								color: "#00453A",
								marginBottom: "20px",
							}}
						>
							Diet Trend (7 Days)
						</h3>

						{/* Calories bar - clean design like image */}
						<div className="space-y-3 mb-6">
							<p
								style={{
									fontSize: "14px",
									fontWeight: 500,
									color: "#546E7A",
								}}
							>
								Calories :
							</p>
							<div className="relative w-full">
								{/* Track: 0 to recommendedTotal */}
								<div
									className="h-8 rounded-lg w-full flex overflow-hidden"
									style={{
										background: "linear-gradient(to right, #F5F5F5 0%, #EEEEEE 100%)",
										border: "1px solid rgba(0,0,0,0.06)",
									}}
								>
									{/* Logged portion (teal) */}
									<div
										className="h-full transition-all rounded-l-lg flex-shrink-0"
										style={{
											width: `${Math.min(
												100,
												(totalLogged / recommendedTotal) * 100,
											)}%`,
											background: "linear-gradient(135deg, #B2DFDB 0%, #80CBC4 100%)",
											borderRight: exceeded > 0 ? "none" : undefined,
										}}
									/>
									{/* Exceeded portion (red) */}
									{exceeded > 0 && (
										<div
											className="h-full flex-shrink-0"
											style={{
												width: `${Math.min(
													100,
													(exceeded / recommendedTotal) * 100,
												)}%`,
												background: "linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%)",
												borderRadius: "0 8px 8px 0",
											}}
										/>
									)}
								</div>
								<div className="flex justify-between mt-1.5 text-sm" style={{ color: "#78909C" }}>
									<span>0</span>
									<span className="font-semibold" style={{ color: "#00453A" }}>
										{totalLogged} / {recommendedTotal} kcal
										{exceeded > 0 && (
											<span className="ml-1" style={{ color: "#D32F2F" }}>
												(+{exceeded} over)
											</span>
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Macros section - always visible */}
						<div>
							<p
								style={{
									fontSize: "14px",
									fontWeight: 600,
									color: "#00453A",
									marginBottom: "12px",
								}}
							>
								Macros
							</p>
							<div className="grid grid-cols-3 gap-4">
								<div
									className="p-4 rounded-xl text-center border"
									style={{
										background: "#FFFFFF",
										borderColor: "rgba(0, 133, 111, 0.15)",
										boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
									}}
								>
									<p style={{ fontSize: "12px", color: "#78909C", marginBottom: "4px" }}>
										Carbs
									</p>
									<p style={{ fontSize: "22px", fontWeight: 700, color: "#00856F" }}>
										{macros?.carbsPercent ?? 0}%
									</p>
								</div>
								<div
									className="p-4 rounded-xl text-center border"
									style={{
										background: "#FFFFFF",
										borderColor: "rgba(0, 133, 111, 0.15)",
										boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
									}}
								>
									<p style={{ fontSize: "12px", color: "#78909C", marginBottom: "4px" }}>
										Protein
									</p>
									<p style={{ fontSize: "22px", fontWeight: 700, color: "#00856F" }}>
										{macros?.proteinPercent ?? 0}%
									</p>
								</div>
								<div
									className="p-4 rounded-xl text-center border"
									style={{
										background: "#FFFFFF",
										borderColor: "rgba(0, 133, 111, 0.15)",
										boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
									}}
								>
									<p style={{ fontSize: "12px", color: "#78909C", marginBottom: "4px" }}>
										Fat
									</p>
									<p style={{ fontSize: "22px", fontWeight: 700, color: "#00856F" }}>
										{macros?.fatPercent ?? 0}%
									</p>
								</div>
							</div>
						</div>
					</Card>

					{/* Weekly Sleep Pattern */}
					{(patient.sleepPattern?.byDay?.length ?? 0) > 0 && (
						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.08)",
							}}
						>
							<h3
								style={{
									fontSize: "18px",
									fontWeight: 700,
									color: "#00453A",
									marginBottom: "16px",
								}}
							>
								Weekly Sleep Pattern
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
							<div className="flex items-center gap-2 mt-4">
								<Moon className="w-5 h-5" style={{ color: "#00856F" }} />
								<span style={{ fontSize: "14px", color: "#546E7A" }}>
									Sleep Quality: {patient.sleepPattern?.avgQuality ?? "No data"}
								</span>
							</div>
						</Card>
					)}

					{/* Glucose Summary + Recent Notes */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.08)",
							}}
							data-testid="card-glucose-summary"
						>
							<h3
								style={{
									fontSize: "20px",
									fontWeight: 700,
									color: "#00453A",
									marginBottom: "24px",
								}}
							>
								Glucose Summary
							</h3>
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<p style={{ fontSize: "13px", color: "#78909C", marginBottom: "8px" }}>
										Highs
									</p>
									<p
										style={{ fontSize: "36px", fontWeight: 700, color: "#00856F" }}
										data-testid="text-highs"
									>
										{patient.glucoseSummary.highs || 0}%
									</p>
								</div>
								<div className="text-center">
									<p style={{ fontSize: "13px", color: "#78909C", marginBottom: "8px" }}>
										Lows
									</p>
									<p
										style={{ fontSize: "36px", fontWeight: 700, color: "#00856F" }}
										data-testid="text-lows"
									>
										{patient.glucoseSummary.lows || 0}%
									</p>
								</div>
								<div className="text-center">
									<p style={{ fontSize: "13px", color: "#78909C", marginBottom: "8px" }}>
										Time in Range
									</p>
									<p
										style={{ fontSize: "36px", fontWeight: 700, color: "#00856F" }}
										data-testid="text-time-in-range"
									>
										{patient.glucoseSummary.timeInRange || 0}%
									</p>
								</div>
							</div>
						</Card>

						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.08)",
							}}
							data-testid="card-recent-notes"
						>
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<ClipboardIcon />
									<h3
										style={{
											fontSize: "20px",
											fontWeight: 700,
											color: "#00453A",
										}}
									>
										Recent Notes
									</h3>
								</div>
								{patient.consultationSummaries &&
									patient.consultationSummaries.length > 3 && (
										<Button
											variant="ghost"
											onClick={() => setIsAllSummariesDialogOpen(true)}
											style={{
												fontSize: "12px",
												fontWeight: 500,
												color: "#00856F",
												padding: "4px 8px",
											}}
										>
											See All
										</Button>
									)}
							</div>

							{patient.recentNotes.length === 0 ? (
								<div
									style={{
										fontSize: "14px",
										color: "#78909C",
										textAlign: "center",
										padding: "20px 0",
									}}
								>
									No consultation summaries available yet.
								</div>
							) : (
								<ul
									className="space-y-3"
									style={{ maxHeight: "200px", overflowY: "auto" }}
								>
									{patient.recentNotes.slice(0, 3).map((note, index) => {
										const summaryData = patient.consultationSummaries?.[index];
										return (
											<li
												key={index}
												className="flex items-start gap-3"
												data-testid={`note-item-${index}`}
											>
												<div
													className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
													style={{ background: "#00856F" }}
												/>
												<div className="flex-1 min-w-0">
													<span
														style={{
															fontSize: "14px",
															color: "#546E7A",
															display: "block",
														}}
													>
														{note}
													</span>
													{summaryData && (
														<div className="mt-1 flex items-center gap-2 flex-wrap">
															<span
																style={{
																	fontSize: "11px",
																	color: "#78909C",
																}}
															>
																{formatDate(
																	new Date(summaryData.date),
																	"MMM dd, yyyy",
																)}
															</span>
															{isAdmin && summaryData.physicianName && (
																<>
																	<span style={{ fontSize: "11px", color: "#78909C" }}>
																		•
																	</span>
																	<span
																		style={{
																			fontSize: "11px",
																			fontWeight: 500,
																			color: "#00856F",
																		}}
																	>
																		Dr. {summaryData.physicianName}
																	</span>
																</>
															)}
														</div>
													)}
												</div>
											</li>
										);
									})}
								</ul>
							)}
							<Button
								className="w-full mt-4"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								Add Notes
							</Button>
						</Card>
					</div>
				</div>
			</main>

			{/* Medical Reports - View-only modal for physician/admin */}
			<PatientLabReportsModal
				open={medicalReportsOpen}
				onOpenChange={setMedicalReportsOpen}
				userId={patientId}
			/>

			<Dialog
				open={isAllSummariesDialogOpen}
				onOpenChange={setIsAllSummariesDialogOpen}
			>
				<DialogContent
					style={{
						maxWidth: "600px",
						maxHeight: "80vh",
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<DialogHeader>
						<DialogTitle
							style={{
								fontSize: "20px",
								fontWeight: 700,
								color: "#00453A",
							}}
						>
							All Consultation Summaries
						</DialogTitle>
					</DialogHeader>
					<div
						style={{
							overflowY: "auto",
							flex: 1,
							padding: "0 24px 24px 24px",
						}}
					>
						{patient.consultationSummaries &&
							patient.consultationSummaries.length > 0 ? (
							<ul className="space-y-4">
								{patient.consultationSummaries.map((summary, index) => (
									<li
										key={index}
										className="flex items-start gap-3 pb-4 border-b last:border-b-0"
										style={{ borderColor: "rgba(0, 0, 0, 0.08)" }}
									>
										<div
											className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
											style={{ background: "#00856F" }}
										/>
										<div className="flex-1 min-w-0">
											<p
												style={{
													fontSize: "14px",
													color: "#546E7A",
													marginBottom: "8px",
													lineHeight: "1.5",
												}}
											>
												{summary.summary}
											</p>
											<div className="flex items-center gap-2 flex-wrap">
												<span
													style={{
														fontSize: "12px",
														color: "#78909C",
													}}
												>
													{formatDate(new Date(summary.date), "MMM dd, yyyy")}
												</span>
												{isAdmin && summary.physicianName && (
													<>
														<span style={{ fontSize: "12px", color: "#78909C" }}>
															•
														</span>
														<span
															style={{
																fontSize: "12px",
																fontWeight: 500,
																color: "#00856F",
															}}
														>
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
							<div
								style={{
									fontSize: "14px",
									color: "#78909C",
									textAlign: "center",
									padding: "40px 0",
								}}
							>
								No consultation summaries available yet.
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
