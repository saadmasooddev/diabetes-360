import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useMedications } from "@/hooks/mutations/useMedical";
import { formatDate, formatTime12 } from "@/lib/utils";
import { ROUTES } from "@/config/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import type { Medication } from "@/services/medicalService";
import { useAppStore } from "@/stores/appStore";
import { DateManager } from "@shared/schema";

interface MedicationsTableProps {
	limit?: number;
	showSeeAll?: boolean;
}

export function MedicationsTable({
	limit = 5,
	showSeeAll = true,
}: MedicationsTableProps) {
	const [, setLocation] = useLocation();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [page, setPage] = useState(1);
	const pageLimit = 10;
	const { setMedicationInfo } = useAppStore()

	const { data: medicationsData, isLoading } = useMedications({
		limit,
		offset: 0,
	});
	const { data: allMedicationsData, isLoading: isLoadingAll } = useMedications({
		limit: pageLimit,
		offset: (page - 1) * pageLimit,
	});

	const handleRowClick = (medication: Medication) => {
		setMedicationInfo({ consultationId: medication.consultationId })
		setLocation(ROUTES.MEDICATIONS)
	};

	const formatPrescriptionDate = (dateString: string): string => {
		const date = new Date(dateString);
		return formatDate(date, "MMM dd, yyyy");
	};

	const medications = medicationsData?.medications || [];
	const allMedications = allMedicationsData?.medications || [];
	const total = medicationsData?.total || 0;
	const allTotal = allMedicationsData?.total || 0;

	if (isLoading) {
		return (
			<Card
				className="p-4 sm:p-6"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				<Skeleton className="h-20 w-full" />
			</Card>
		);
	}

	if (medications.length === 0) {
		return (
			<Card
				className="p-6 text-center text-gray-500 text-sm sm:text-base"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				No medications recorded yet.
			</Card>
		);
	}

	return (
		<>
			{/* Mobile: Card view, Desktop: Table view */}
			<div className="block sm:hidden space-y-3">
				{medications.map((medication) => (
					<Card
						key={medication.id}
						className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
						onClick={() => handleRowClick(medication)}
						style={{
							background: "#FFFFFF",
							border: "1px solid rgba(0, 0, 0, 0.1)",
							borderRadius: "12px",
						}}
					>
						<div className="space-y-2">
							<div>
								<p className="text-xs text-gray-400 mb-1">Date</p>
								<p className="text-xs text-gray-700 font-medium">
									{formatPrescriptionDate(medication.prescriptionDate)}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-1">Doctor</p>
								<p className="text-xs text-gray-700">
									{medication.physician
										? `${medication.physician.firstName} ${medication.physician.lastName}`
										: "Unknown Doctor"}
								</p>
								{medication.physician?.specialty && (
									<p className="text-xs text-gray-700">
										{medication.physician.specialty}
									</p>
								)}
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-1">Prescription</p>
								<p className="text-xs text-gray-700">
									{medication.medicines.length} medicine
									{medication.medicines.length !== 1 ? "s" : ""} prescribed
								</p>
							</div>
						</div>
					</Card>
				))}
			</div>
			<Card
				className="hidden sm:block p-4 sm:p-6"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Date
								</TableHead>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Doctor
								</TableHead>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Consultation Time
								</TableHead>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Prescription
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{medications.map((medication) => (
								<TableRow
									key={medication.id}
									className="cursor-pointer hover:bg-gray-50 transition-colors"
									onClick={() => handleRowClick(medication)}
								>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{formatPrescriptionDate(medication.prescriptionDate)}
									</TableCell>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{medication.physician
											? `${medication.physician.firstName} ${medication.physician.lastName}`
											: "Unknown Doctor"}
										{medication.physician?.specialty && (
											<p>{medication.physician.specialty}</p>
										)}
									</TableCell>
									<TableCell className="text-gray-500 text-xs sm:text-sm">
										{DateManager.formatDate(medication.consultation.date)}{" "}{formatTime12(medication.consultation.startTime)}
									</TableCell>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{medication.medicines.length} medicine
										{medication.medicines.length !== 1 ? "s" : ""} prescribed
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Card>
			{showSeeAll && total > limit && (
				<Button
					variant="ghost"
					onClick={() => setIsModalOpen(true)}
					className="mt-3 sm:mt-4 text-teal-600 hover:text-teal-700 text-xs sm:text-sm"
					size="sm"
				>
					See All ({total})
				</Button>
			)}

			{/* All Medications Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
					<DialogHeader>
						<DialogTitle
							className="text-lg sm:text-xl"
							style={{ color: "#00856F" }}
						>
							All Medications
						</DialogTitle>
					</DialogHeader>
					{isLoadingAll ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-20 sm:h-24 w-full" />
							))}
						</div>
					) : allMedications.length > 0 ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{/* Mobile: Card view, Desktop: Table view */}
							<div className="block sm:hidden space-y-3">
								{allMedications.map((medication) => (
									<Card
										key={medication.id}
										className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
										onClick={() => {
											setIsModalOpen(false);
											handleRowClick(medication);
										}}
										style={{
											background: "#FFFFFF",
											border: "1px solid rgba(0, 0, 0, 0.1)",
											borderRadius: "12px",
										}}
									>
										<div className="space-y-2">
											<div>
												<p className="text-xs text-gray-400 mb-1">Date</p>
												<p className="text-xs text-gray-700 font-medium">
													{formatPrescriptionDate(medication.prescriptionDate)}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-400 mb-1">Doctor</p>
												<p className="text-xs text-gray-700">
													{medication.physician
														? `${medication.physician.firstName} ${medication.physician.lastName}${medication.physician.specialty ? ` - ${medication.physician.specialty}` : ""}`
														: "Unknown Doctor"}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-400 mb-1">
													Prescription
												</p>
												<p className="text-xs text-gray-700">
													{medication.medicines.length} medicine
													{medication.medicines.length !== 1 ? "s" : ""}{" "}
													prescribed
												</p>
											</div>
										</div>
									</Card>
								))}
							</div>
							<div className="hidden sm:block overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Date
											</TableHead>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Doctor
											</TableHead>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Prescription
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{allMedications.map((medication) => (
											<TableRow
												key={medication.id}
												className="cursor-pointer hover:bg-gray-50 transition-colors"
												onClick={() => {
													setIsModalOpen(false);
													handleRowClick(medication);
												}}
											>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{formatPrescriptionDate(medication.prescriptionDate)}
												</TableCell>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{medication.physician
														? `${medication.physician.firstName} ${medication.physician.lastName}${medication.physician.specialty ? ` - ${medication.physician.specialty}` : ""}`
														: "Unknown Doctor"}
												</TableCell>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{medication.medicines.length} medicine
													{medication.medicines.length !== 1 ? "s" : ""}{" "}
													prescribed
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							{allTotal > pageLimit && (
								<div className="mt-3 sm:mt-4">
									<ReusablePagination
										currentPage={page}
										totalPages={Math.ceil(allTotal / pageLimit)}
										onPageChange={setPage}
									/>
								</div>
							)}
						</div>
					) : (
						<p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
							No medications found
						</p>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
