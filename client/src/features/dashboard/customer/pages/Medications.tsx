import { useSearch } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { useMedicationsByPhysicianAndDate } from "@/hooks/mutations/useMedical";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import type { Medicine } from "@/services/medicalService";

export function Medications() {
	const searchString = useSearch();
	const searchParams = new URLSearchParams(searchString);
	const [, setLocation] = useLocation();
	const physicianId = searchParams.get("physicianId");
	const prescriptionDate = searchParams.get("date");

	const { data, isLoading } = useMedicationsByPhysicianAndDate(
		physicianId,
		prescriptionDate,
	);

	const handleBack = () => {
		setLocation(ROUTES.MEDICAL_RECORDS);
	};

	if (!physicianId || !prescriptionDate) {
		return (
			<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
				<Sidebar />
				<main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
					<div className="w-full max-w-[1200px] mx-auto">
						<Card className="p-6 text-center">
							<p className="text-gray-500">
								Invalid parameters. Please go back to medical records.
							</p>
							<Button
								onClick={handleBack}
								className="mt-4"
								style={{ background: "#00856F", color: "#FFFFFF" }}
							>
								Go Back
							</Button>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	const medications = data?.medications || [];
	const physician = data?.physician;
	const date = data?.prescriptionDate
		? formatDate(new Date(data.prescriptionDate), "MMM dd, yyyy")
		: "";

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />
			<main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
				<div className="w-full max-w-[1200px] mx-auto">
					{/* Header */}
					<div className="mb-6">
						<Button
							variant="ghost"
							onClick={handleBack}
							className="mb-4 text-teal-600 hover:text-teal-700"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Medical Records
						</Button>
						<h1
							style={{
								fontSize: "36px",
								fontWeight: 700,
								color: "#00453A",
								lineHeight: "44px",
								letterSpacing: "-0.02em",
								marginBottom: "8px",
							}}
						>
							Medications
						</h1>
						{physician && date && (
							<p
								style={{
									fontSize: "16px",
									color: "#546E7A",
									lineHeight: "24px",
								}}
							>
								Prescribed by {physician.firstName} {physician.lastName}
								{physician.specialty ? ` - ${physician.specialty}` : ""} on{" "}
								{date}
							</p>
						)}
					</div>

					{/* Medications List */}
					{isLoading ? (
						<Card className="p-6">
							<Skeleton className="h-32 w-full" />
						</Card>
					) : medications.length === 0 ? (
						<Card className="p-6 text-center text-gray-500">
							No medications found for this date.
						</Card>
					) : (
						<div className="space-y-4">
							{medications.map((medication) => (
								<Card
									key={medication.id}
									className="p-6"
									style={{
										background: "#FFFFFF",
										border: "1px solid rgba(0, 133, 111, 0.12)",
										borderRadius: "16px",
										boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
									}}
								>
									<div className="space-y-4">
										{(medication.medicines as Medicine[]).map(
											(medicine, index) => (
												<div
													key={index}
													className="p-4 rounded-lg"
													style={{
														background: "rgba(0, 133, 111, 0.05)",
														borderLeft: "4px solid #00856F",
													}}
												>
													<div className="flex items-start gap-3">
														<div
															className="flex items-center justify-center rounded-lg"
															style={{
																width: "40px",
																height: "40px",
																background: "#00856F",
															}}
														>
															<Pill className="w-5 h-5 text-white" />
														</div>
														<div className="flex-1">
															<h3
																className="mb-2"
																style={{
																	fontSize: "18px",
																	fontWeight: 700,
																	color: "#00453A",
																}}
															>
																{medicine.name}
															</h3>
															<div className="space-y-1">
																{medicine.dosage && (
																	<p className="text-sm text-gray-600">
																		<span className="font-medium">Dosage:</span>{" "}
																		{medicine.dosage}
																	</p>
																)}
																{medicine.frequency && (
																	<p className="text-sm text-gray-600">
																		<span className="font-medium">
																			Frequency:
																		</span>{" "}
																		{medicine.frequency}
																	</p>
																)}
																{medicine.duration && (
																	<p className="text-sm text-gray-600">
																		<span className="font-medium">
																			Duration:
																		</span>{" "}
																		{medicine.duration}
																	</p>
																)}
																{medicine.instructions && (
																	<p className="text-sm text-gray-600 mt-2">
																		<span className="font-medium">
																			Instructions:
																		</span>{" "}
																		{medicine.instructions}
																	</p>
																)}
															</div>
														</div>
													</div>
												</div>
											),
										)}
									</div>
								</Card>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
