import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Loader2, Plus, Stethoscope, User } from "lucide-react";
import type { UserConsultation } from "server/src/modules/booking/repository/booking.repository";
import type { ConsultationMedication } from "@/services/bookingService";
import { SUMMARY_STATUS_ENUM } from "@shared/schema";
import { useUpdateConsultationNote } from "@/hooks/mutations/useMedical";
import { toast } from "@/hooks/use-toast";
import { ROUTES } from "@/config/routes";
import { usePatientById } from "@/hooks/mutations/usePatients";
import { getDateRange } from "../components/HealthTrendChart";

const defaultMedication = (): ConsultationMedication => ({
	name: "",
	dosage: "",
	frequency: "",
	duration: "",
	instructions: "",
});

type MedicationRow = ConsultationMedication & { rowId: string };

const withRowIds = (items: ConsultationMedication[]): MedicationRow[] =>
	items.map((m) => ({ ...m, rowId: crypto.randomUUID() }));

function findConsultation(
	patientAppointments: UserConsultation[] | undefined,
	bookingId: string,
): UserConsultation | undefined {
	const list = patientAppointments ?? [];
	return list.find((c) => String(c.id) === bookingId);
}

export function SoapNotePage() {
	const [, navigate] = useLocation();
	const [matchDoctor, paramsDoctor] = useRoute<{
		profileId: string;
		bookingId: string;
	}>(ROUTES.DOCTOR_PATIENT_SOAP_NOTE);
	const [matchAdmin, paramsAdmin] = useRoute<{
		profileId: string;
		bookingId: string;
	}>(ROUTES.ADMIN_PATIENT_SOAP_NOTE);

	const isAdmin = !!matchAdmin;
	const profileId = (matchDoctor ? paramsDoctor?.profileId : paramsAdmin?.profileId) ?? null;
	const bookingId = (matchDoctor ? paramsDoctor?.bookingId : paramsAdmin?.bookingId) ?? null;

	const dateRange = useMemo(() => getDateRange("weekly"), []);
	const {
		data: patient,
		isLoading,
		error,
		refetch: refetchPatient,
	} = usePatientById(profileId, dateRange);

	const consultation = useMemo(() => {
		if (!patient || !bookingId) return undefined;
		return (
			findConsultation(patient.appointments, bookingId) ??
			findConsultation(patient.upcomingAppointments, bookingId)
		);
	}, [patient, bookingId]);

	const physicianName = consultation
		? `${consultation.slot.physician.firstName} ${consultation.slot.physician.lastName}`
		: "";

	const [summary, setSummary] = useState("");
	const [medications, setMedications] = useState<MedicationRow[]>(() =>
		withRowIds([defaultMedication()]),
	);
	const { mutate: updateConsultationNoteMutation, isPending } =
		useUpdateConsultationNote();

	useEffect(() => {
		if (consultation) {
			setSummary(consultation.summary ?? "");
			const base = consultation.medications?.length
				? consultation.medications
				: [defaultMedication()];
			setMedications(withRowIds(base));
		}
	}, [consultation]);

	const profileHref =
		profileId === null
			? isAdmin
				? ROUTES.ADMIN_PATIENTS
				: ROUTES.DOCTOR_PATIENTS
			: isAdmin
				? ROUTES.ADMIN_PATIENT_PROFILE.replace(":profileId", profileId)
				: ROUTES.DOCTOR_PATIENT_PROFILE.replace(":profileId", profileId);

	const addMedication = () => {
		setMedications((prev) => [
			...prev,
			{ ...defaultMedication(), rowId: crypto.randomUUID() },
		]);
	};

	const updateMedication = (
		rowId: string,
		field: keyof ConsultationMedication,
		value: string,
	) => {
		setMedications((prev) =>
			prev.map((m) => (m.rowId === rowId ? { ...m, [field]: value } : m)),
		);
	};

	const removeMedication = (rowId: string) => {
		if (medications.length <= 1) return;
		setMedications((prev) => prev.filter((m) => m.rowId !== rowId));
	};

	const save = async (status: SUMMARY_STATUS_ENUM) => {
		const trimmed = summary.trim();
		if (!trimmed) {
			toast({
				title: "Summary is required.",
				description: "Please enter a summary for the consultation.",
				variant: "destructive",
			});
			return;
		}
		if (!consultation) return;

		const payloadMedications: ConsultationMedication[] = medications.map(
			({ rowId: _rowId, ...med }) => med,
		);

		updateConsultationNoteMutation(
			{
				bookingId: consultation.id,
				payload: {
					summary: trimmed,
					summaryStatus: status,
					medications: payloadMedications,
					userId: consultation.customerId,
					physicianId: consultation.slot.physician.id,
				},
			},
			{
				onSuccess: async () => {
					await refetchPatient();
					navigate(profileHref);
				},
				onError: () => {
					toast({
						title: "Error",
						description: "Failed to save note.",
						variant: "destructive",
					});
				},
			},
		);
	};

	const handleSaveAsDraft = () => save(SUMMARY_STATUS_ENUM.SAVE_AS_DRAFT);
	const handleSignAndSave = () => save(SUMMARY_STATUS_ENUM.SIGNED);

	if (!profileId || !bookingId) {
		return (
			<div className="flex min-h-screen bg-[#F7F9F9]">
				<Sidebar />
				<main className="flex-1 p-6 lg:p-8 overflow-auto">
					<div className="max-w-5xl mx-auto text-center py-12 text-red-500">
						Invalid link.
					</div>
				</main>
			</div>
		);
	}

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
						Failed to load patient. Please try again.
					</div>
				</main>
			</div>
		);
	}

	if (!consultation) {
		return (
			<div className="flex min-h-screen bg-[#F7F9F9]">
				<Sidebar />
				<main className="flex-1 p-6 lg:p-8 overflow-auto">
					<div className="max-w-5xl mx-auto flex items-center justify-center py-12">
						<button
							type="button"
							onClick={() => navigate(profileHref)}
							className="flex items-center gap-2 text-[#475569] hover:text-[#00856F] transition-colors text-sm font-medium"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to profile
						</button>
						<Card className="p-8 rounded-2xl border border-[#e2e8f0] text-center text-[#64748b]">
							This consultation could not be found for this patient.
						</Card>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-[#F7F9F9]">
			<Sidebar />
			<main className="flex-1 flex-col p-4 lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6 ">
					<button
						type="button"
						onClick={() => navigate(profileHref)}
						className="flex items-center gap-2 text-[#475569] hover:text-[#00856F] transition-colors text-sm font-medium"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to profile
					</button>

					<Card className="p-5 lg:p-6 bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
						<h1 className="text-[#00453A] font-bold text-lg mb-6">Soap Note</h1>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#EAEAEA]">
							<div>
								<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
									<User className="h-3.5 w-3.5" />
									Patient Name
								</div>
								<p className="text-sm font-semibold text-[#0f172a]">{patient.name}</p>
							</div>
							<div>
								<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
									<FileText className="h-3.5 w-3.5" />
									MRN
								</div>
								<p className="text-sm font-semibold text-[#0f172a]">
									{patient.id ?? "—"}
								</p>
							</div>
							<div>
								<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
									<Stethoscope className="h-3.5 w-3.5" />
									Consulting Provider
								</div>
								<p className="text-sm font-semibold text-[#0f172a]">{physicianName}</p>
							</div>
						</div>

						<div className="space-y-2 py-4">
							<Label
								htmlFor="soap-summary"
								className="text-sm font-medium text-[#374151]"
							>
								Summary <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="soap-summary"
								placeholder="Enter consultation summary..."
								value={summary}
								onChange={(e) => setSummary(e.target.value)}
								className="min-h-[120px] resize-y border-[#EAEAEA] focus-visible:ring-[#00856F]"
								data-testid="soap-note-summary"
							/>
						</div>

						<div className="space-y-3 py-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium text-[#374151]">
									Medications
								</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addMedication}
									className="h-8 w-8 p-0 border-[#00856F] text-[#00856F] hover:bg-[#00856F]/10"
									aria-label="Add medication"
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
							<div className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1 custom-scrollbar ">
								{medications.map((med) => (
									<div
										key={med.rowId}
										className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-[#EAEAEA] bg-[#F7F9F9]/50"
									>
										<div className="sm:col-span-2">
											<Label className="text-xs text-[#546E7A]">Medication</Label>
											<Input
												placeholder="Type medication name..."
												value={med.name}
												onChange={(e) =>
													updateMedication(med.rowId, "name", e.target.value)
												}
												className="mt-1 border-[#EAEAEA] h-9"
											/>
										</div>
										<div>
											<Label className="text-xs text-[#546E7A]">Dosage</Label>
											<Input
												placeholder="e.g., 40"
												value={med.dosage ?? ""}
												onChange={(e) =>
													updateMedication(med.rowId, "dosage", e.target.value)
												}
												className="mt-1 border-[#EAEAEA] h-9"
											/>
										</div>
										<div>
											<Label className="text-xs text-[#546E7A]">Frequency</Label>
											<Input
												placeholder="e.g., twice daily"
												value={med.frequency ?? ""}
												onChange={(e) =>
													updateMedication(med.rowId, "frequency", e.target.value)
												}
												className="mt-1 border-[#EAEAEA] h-9"
											/>
										</div>
										<div>
											<Label className="text-xs text-[#546E7A]">Duration</Label>
											<Input
												placeholder="e.g., 7 days"
												value={med.duration ?? ""}
												onChange={(e) =>
													updateMedication(med.rowId, "duration", e.target.value)
												}
												className="mt-1 border-[#EAEAEA] h-9"
											/>
										</div>
										<div className="sm:col-span-2">
											<Label className="text-xs text-[#546E7A]">Instructions</Label>
											<Input
												placeholder="Additional instructions"
												value={med.instructions ?? ""}
												onChange={(e) =>
													updateMedication(med.rowId, "instructions", e.target.value)
												}
												className="mt-1 border-[#EAEAEA] h-9"
											/>
										</div>
										{medications.length > 1 && (
											<div className="sm:col-span-2 flex justify-end">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
													onClick={() => removeMedication(med.rowId)}
												>
													Remove
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-end gap-2 pt-4 border-t border-[#EAEAEA]">
							{/* <Button
								type="button"
								variant="outline"
								onClick={handleSaveAsDraft}
								disabled={isPending}
								className="border-[#EAEAEA] text-[#374151] hover:bg-[#F7F9F9]"
								data-testid="soap-note-save-draft"
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<FileText className="h-4 w-4 mr-2" />
								)}
								Save as Draft
							</Button> */}
							<Button
								type="button"
								onClick={handleSignAndSave}
								disabled={isPending}
								className="bg-[#00856F] hover:bg-[#006B5A] text-white"
								data-testid="soap-note-sign-save"
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Sign & Save
							</Button>
						</div>
					</Card>
				</div>
			</main>
		</div>
	);
}
