import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, FileText, Stethoscope, Plus, Loader2 } from "lucide-react";
import type { UserConsultation } from "server/src/modules/booking/repository/booking.repository";
import {
	bookingService,
	type ConsultationMedication,
} from "@/services/bookingService";
import { SUMMARY_STATUS_ENUM } from "@shared/schema";
import { useUpdateConsultationNote } from "@/hooks/mutations/useMedical";
import { toast } from "@/hooks/use-toast";

export interface SoapNoteModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	consultation: UserConsultation | null;
	patientName: string;
	patientMrn: string;
	onSaved?: () => void;
}

const defaultMedication = (): ConsultationMedication => ({
	name: "",
	dosage: "",
	frequency: "",
	duration: "",
	instructions: "",
});

export function SoapNoteModal({
	open,
	onOpenChange,
	consultation,
	patientName,
	patientMrn,
	onSaved,
}: SoapNoteModalProps) {
	const physicianName = consultation
		? `${consultation.slot.physician.firstName} ${consultation.slot.physician.lastName}`
		: "";

	const [summary, setSummary] = useState("");
	const [medications, setMedications] = useState<ConsultationMedication[]>([
		defaultMedication(),
	]);
	const { mutate: updateConsultationNoteMutation, isPending } =
		useUpdateConsultationNote();

	useEffect(() => {
		if (open && consultation) {
			setSummary(consultation.summary ?? "");
			setMedications(consultation.medications || [defaultMedication()]);
		}
	}, [open, consultation]);

	const addMedication = () => {
		setMedications((prev) => [...prev, defaultMedication()]);
	};

	const updateMedication = (
		index: number,
		field: keyof ConsultationMedication,
		value: string,
	) => {
		setMedications((prev) =>
			prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
		);
	};

	const removeMedication = (index: number) => {
		if (medications.length <= 1) return;
		setMedications((prev) => prev.filter((_, i) => i !== index));
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

		updateConsultationNoteMutation(
			{
				bookingId: consultation.id,
				payload: {
					summary: trimmed,
					summaryStatus: status,
					medications,
					userId: consultation.customerId,
					physicianId: consultation.slot.physician.id,
				},
			},
			{
				onSuccess: () => {
					onSaved?.();
					onOpenChange(false);
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

	if (!consultation) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className=" p-4 max-w-[640px] max-h-[90vh] overflow-y-auto">
				<DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<DialogTitle className="text-[#00453A] font-bold text-lg">
						Soap Note
					</DialogTitle>
				</DialogHeader>

				{/* Patient & Provider info */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#EAEAEA]">
					<div>
						<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
							<User className="h-3.5 w-3.5" />
							Patient Name
						</div>
						<p className="text-sm font-semibold text-[#0f172a]">
							{patientName}
						</p>
					</div>
					<div>
						<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
							<FileText className="h-3.5 w-3.5" />
							MRN
						</div>
						<p className="text-sm font-semibold text-[#0f172a]">{patientMrn}</p>
					</div>
					<div>
						<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#546E7A] mb-1">
							<Stethoscope className="h-3.5 w-3.5" />
							Consulting Provider
						</div>
						<p className="text-sm font-semibold text-[#0f172a]">
							{physicianName}
						</p>
					</div>
				</div>

				{/* Summary */}
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

				{/* Medications */}
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
					<div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
						{medications.map((med, index) => (
							<div
								key={index}
								className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-[#EAEAEA] bg-[#F7F9F9]/50"
							>
								<div className="sm:col-span-2">
									<Label className="text-xs text-[#546E7A]">Medication</Label>
									<Input
										placeholder="Type medication name..."
										value={med.name}
										onChange={(e) =>
											updateMedication(index, "name", e.target.value)
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
											updateMedication(index, "dosage", e.target.value)
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
											updateMedication(index, "frequency", e.target.value)
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
											updateMedication(index, "duration", e.target.value)
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
											updateMedication(index, "instructions", e.target.value)
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
											onClick={() => removeMedication(index)}
										>
											Remove
										</Button>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2 pt-4 border-t border-[#EAEAEA]">
					<Button
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
					</Button>
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
			</DialogContent>
		</Dialog>
	);
}
