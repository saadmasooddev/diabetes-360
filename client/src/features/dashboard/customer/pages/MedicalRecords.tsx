import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { GlucoseChartSection } from "../../components/GlucoseChartSection";
import { PastConsultationsList } from "../../components/PastConsultationsList";
import { MedicationsTable } from "../../components/MedicationsTable";
import { UploadMedicalReportsModal } from "../../components/UploadMedicalReportsModal";

export function MedicalRecords() {
	const user = useAuthStore((state) => state.user);
	const isPaidUser = user?.paymentType !== "free" && user?.paymentType;
	const [medicalReportsModalOpen, setMedicalReportsModalOpen] = useState(false);
	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
				<div className="w-full max-w-full mx-auto space-y-8">
					{/* Glucose Logs Section */}
					<div>
						<h2
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#00856F",
								marginBottom: "24px",
							}}
							data-testid="text-glucose-logs-title"
						>
							Glucose Logs
						</h2>
						<GlucoseChartSection />
					</div>

					{/* Consultations Section */}
					<div>
						<h2
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#00856F",
								marginBottom: "24px",
							}}
							data-testid="text-consultations-title"
						>
							Consultations
						</h2>
						<PastConsultationsList limit={2} showSeeAll={true} />
					</div>

					{/* Medications Section */}
					<div>
						<h2
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#00856F",
								marginBottom: "24px",
							}}
							data-testid="text-medications-title"
						>
							Medications
						</h2>

						{!isPaidUser ? (
							<Card
								className="p-6 flex items-center justify-center"
								style={{
									background: "#F7F9F9",
									borderRadius: "12px",
									border: "2px dashed rgba(0, 133, 111, 0.3)",
									minHeight: "160px",
								}}
								data-testid="card-medications-locked"
							>
								<div className="text-center">
									<div
										className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
										style={{ background: "#E8F5F3" }}
									>
										<Lock size={32} color="#00856F" />
									</div>
									<p
										style={{
											fontSize: "14px",
											fontWeight: 500,
											color: "#546E7A",
											maxWidth: "300px",
										}}
									>
										Subscribe to Premium
										<br />
										to unlock smart medication reminders and logs.
									</p>
								</div>
							</Card>
						) : (
							<MedicationsTable limit={5} showSeeAll={true} />
						)}
					</div>

					{/* Lab Reports Section */}
					<div>
						<h2
							style={{
								fontSize: "28px",
								fontWeight: 700,
								color: "#00856F",
								marginBottom: "24px",
							}}
							data-testid="text-lab-reports-title"
						>
							Reports
						</h2>
						<Card
							className="p-6"
							style={{
								background: "#FFFFFF",
								borderRadius: "12px",
								border: "1px solid rgba(0, 133, 111, 0.2)",
							}}
						>
							<div className="flex items-center justify-between">
								<p
									style={{
										fontSize: "16px",
										fontWeight: 400,
										color: "#546E7A",
									}}
								>
									View and upload your medical reports
								</p>
								<Button
									onClick={() => setMedicalReportsModalOpen(true)}
									style={{
										background: "#E0F2F1",
										color: "#00856F",
										fontWeight: 600,
										fontSize: "14px",
										borderRadius: "8px",
										padding: "12px 24px",
									}}
									data-testid="button-open-reports-modal"
								>
									View Reports
								</Button>
							</div>
						</Card>
						<UploadMedicalReportsModal
							open={medicalReportsModalOpen}
							onOpenChange={setMedicalReportsModalOpen}
							initialStep={1}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
