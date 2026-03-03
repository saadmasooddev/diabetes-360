import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	useLabReportsByUserId,
	useViewLabReport,
	isImageFileName,
} from "@/hooks/mutations/useMedical";
import { LabReportImageLightbox } from "./LabReportImageLightbox";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { ChevronLeft, Eye, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LabReport } from "@/services/medicalService";
import { PAGE_SIZE, REPORT_TYPES } from "./UploadMedicalReportsModal";

interface PatientLabReportsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string | null;
}

export function PatientLabReportsModal({
	open,
	onOpenChange,
	userId,
}: PatientLabReportsModalProps) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

	const { data, isLoading } = useLabReportsByUserId(userId, {
		limit: PAGE_SIZE,
		offset: (page - 1) * PAGE_SIZE,
		search: search || undefined,
	});
	const viewMutation = useViewLabReport();

	const reports = data?.reports ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

	const handleBack = () => onOpenChange(false);

	const handleViewReport = (report: LabReport) => {
		viewMutation.mutate(
			{
				reportId: report.id,
				fileName: report.fileName,
				forUserId: userId ?? undefined,
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

	const formatReportDate = (report: LabReport) => {
		const d = report.dateOfReport || report.uploadedAt;
		return formatDate(new Date(d), "dd/MM/yyyy");
	};

	const getReportTypeLabel = (type: string | null | undefined) => {
		if (!type) return "Other";
		const found = REPORT_TYPES.find((t) => t.value === type);
		return found?.label ?? type;
	};

	const displayName = (report: LabReport) =>
		report.reportName || report.fileName;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-lg p-6"
				style={{
					background: "#FFFFFF",
					borderRadius: "16px",
					border: "1px solid rgba(0, 133, 111, 0.12)",
					boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
				}}
			>
				<DialogHeader className="flex flex-row items-center gap-2">
					<button
						type="button"
						onClick={handleBack}
						className="p-1 rounded-lg hover:bg-gray-100"
					>
						<ChevronLeft
							className="w-5 h-5"
							style={{ color: "#00856F" }}
						/>
					</button>
					<DialogTitle
						style={{
							color: "#00856F",
							fontSize: "20px",
							fontWeight: 700,
						}}
					>
						Patient Lab Reports
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					<div className="flex items-center gap-2">
						<div
							className="flex-1 rounded-lg border p-2 flex items-center"
							style={{ borderColor: "rgba(0, 133, 111, 0.2)" }}
						>
							<input
								type="text"
								placeholder="Search by name"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="flex-1 bg-transparent outline-none text-sm"
							/>
						</div>
					</div>

					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="w-8 h-8 animate-spin text-[#00856F]" />
						</div>
					) : reports.length === 0 ? (
						<div
							className="py-12 text-center rounded-lg border border-dashed"
							style={{
								borderColor: "rgba(0, 133, 111, 0.3)",
								background: "#F7F9F9",
							}}
						>
							<p className="text-gray-600">No lab reports uploaded yet</p>
						</div>
					) : (
						<>
							<div className="space-y-3 max-h-64 overflow-y-auto">
								{reports.map((report) => (
									<div
										key={report.id}
										className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
										style={{
											borderColor: "rgba(0, 133, 111, 0.15)",
										}}
									>
										<div className="flex-1 min-w-0">
											<p
												className="font-medium truncate"
												style={{ color: "#00453A" }}
											>
												{displayName(report)}
											</p>
											<p className="text-xs text-gray-500">
												{formatReportDate(report)} •{" "}
												<span
													className="px-2 py-0.5 rounded text-xs"
													style={{
														background: "#E0F2F1",
														color: "#00856F",
														border: "1px solid rgba(0, 133, 111, 0.3)",
													}}
												>
													{getReportTypeLabel(report.reportType)}
												</span>
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleViewReport(report)}
											disabled={viewMutation.isPending}
											style={{
												borderColor: "#00856F",
												color: "#00856F",
												borderRadius: "8px",
											}}
										>
											<Eye className="w-4 h-4 mr-1" />
											View
										</Button>
									</div>
								))}
							</div>
							<ReusablePagination
								currentPage={page}
								totalPages={totalPages}
								onPageChange={setPage}
							/>
						</>
					)}
				</div>
			</DialogContent>
			{imageViewerUrl && (
				<LabReportImageLightbox
					open={!!imageViewerUrl}
					onClose={closeImageViewer}
					src={imageViewerUrl}
				/>
			)}
		</Dialog>
	);
}
