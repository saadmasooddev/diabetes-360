import { useState, useRef, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useLabReports,
	useUploadLabReport,
	useViewLabReport,
	useDeleteLabReport,
	isImageFileName,
} from "@/hooks/mutations/useMedical";
import { LabReportImageLightbox } from "./LabReportImageLightbox";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import {
	ChevronLeft,
	Upload,
	Plus,
	Eye,
	Loader2,
	X,
	Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { LabReport } from "@/services/medicalService";
import { toast } from "@/hooks/use-toast";

export const REPORT_TYPES = [
	{ value: "blood_test", label: "Blood Test" },
	{ value: "xray", label: "X-Ray" },
	{ value: "ecg", label: "ECG" },
	{ value: "prescription", label: "Prescription" },
	{ value: "mri_ct", label: "MRI/CT Scan" },
	{ value: "other", label: "Other" },
];

export const PAGE_SIZE = 10;

interface UploadMedicalReportsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialStep?: 1 | 2;
}

export function UploadMedicalReportsModal({
	open,
	onOpenChange,
	initialStep = 1,
}: UploadMedicalReportsModalProps) {
	const [step, setStep] = useState<1 | 2>(initialStep);

	useEffect(() => {
		if (open) {
			setStep(initialStep);
		}
	}, [open, initialStep]);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [reportName, setReportName] = useState("");
	const [reportType, setReportType] = useState("");
	const [dateOfReport, setDateOfReport] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data, isLoading } = useLabReports({
		limit: PAGE_SIZE,
		offset: (page - 1) * PAGE_SIZE,
		search: search || undefined,
	});
	const uploadMutation = useUploadLabReport();
	const viewMutation = useViewLabReport();
	const deleteMutation = useDeleteLabReport();

	const reports = data?.reports ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

	const handleBack = () => {
		if (step === 2) {
			setStep(1);
			setReportName("");
			setReportType("");
			setDateOfReport("");
			setSelectedFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
		} else {
			onOpenChange(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const allowed = [
				"application/pdf",
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
			];
			if (!allowed.includes(file.type)) return;
			if (file.size > 10 * 1024 * 1024) return;
			setSelectedFile(file);
		}
	};

	const handleUpload = () => {
		if (!selectedFile) return;
		if (!dateOfReport) {
			toast({
				title: "Error",
				description: "Date of report is required",
				variant: "destructive",
			})
			return;
		}

		uploadMutation.mutate(
			{
				file: selectedFile,
				metadata: {
					reportName: reportName || undefined,
					reportType: reportType || undefined,
					dateOfReport: dateOfReport || undefined,
				},
			},
			{
				onSuccess: () => {
					setReportName("");
					setReportType("");
					setDateOfReport("");
					setSelectedFile(null);
					if (fileInputRef.current) fileInputRef.current.value = "";
				},
			},
		);
	};

	const clearSelectedFile = () => {
		setSelectedFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleViewReport = (report: LabReport) => {
		viewMutation.mutate(
			{ reportId: report.id, fileName: report.fileName },
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
				className=" sm:max-w-lg p-6  overflow-y-scroll "
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
						<ChevronLeft className="w-5 h-5" style={{ color: "#00856F" }} />
					</button>
					<DialogTitle
						style={{
							color: "#00856F",
							fontSize: "20px",
							fontWeight: 700,
						}}
					>
						{step === 1 ? "Reports" : "Upload Reports"}
					</DialogTitle>
				</DialogHeader>

				{step === 1 ? (
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
							<Button
								onClick={() => setStep(2)}
								size="sm"
								style={{
									background: "#E0F2F1",
									color: "#00856F",
									borderRadius: "8px",
									fontWeight: 600,
								}}
							>
								<Plus className="w-4 h-4 mr-1" />
								Upload Reports +
							</Button>
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
								<p className="text-gray-600 mb-4">No reports uploaded yet</p>
								<Button
									onClick={() => setStep(2)}
									style={{
										background: "#00856F",
										color: "#FFFFFF",
									}}
								>
									<Upload className="w-4 h-4 mr-2" />
									Upload your first report
								</Button>
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
											</Button>

											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													deleteMutation.mutate(report.id, {
														onSuccess: () => { },
													})
												}
												disabled={deleteMutation.isPending}
												style={{
													borderColor: "#00856F",
													color: "#00856F",
													borderRadius: "8px",
												}}
											>
												<Trash2 className="w-4 h-4 mr-1" />
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
				) : (
					<div className="mt-4 space-y-6">
						<div
							className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer hover:bg-gray-50 transition-colors"
							onClick={() => fileInputRef.current?.click()}
							style={{
								borderColor: "rgba(0, 133, 111, 0.3)",
								background: "#F7F9F9",
							}}
						>
							{selectedFile ? (
								<>
									<div className="flex items-center gap-2 w-full justify-center">
										<p className="font-medium text-gray-700 truncate max-w-[200px]">
											{selectedFile.name}
										</p>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												clearSelectedFile();
											}}
											className="p-1 rounded hover:bg-gray-200"
											aria-label="Remove file"
										>
											<X className="w-4 h-4 text-gray-500" />
										</button>
									</div>
									<p className="text-sm text-gray-500 mt-1">
										Click to change file
									</p>
								</>
							) : (
								<>
									<div
										className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
										style={{ background: "#E0F2F1" }}
									>
										<Plus className="w-8 h-8" style={{ color: "#00856F" }} />
									</div>
									<p className="font-medium text-gray-700">
										Tap to Select File
									</p>
									<p className="text-sm text-gray-500">
										Choose from gallery, camera or file manager
									</p>
									<div className="flex gap-2 mt-2">
										{["PDF", "JPG", "PNG"].map((ext) => (
											<span
												key={ext}
												className="px-3 py-1 rounded-full text-xs bg-white border border-gray-200"
											>
												{ext}
											</span>
										))}
									</div>
								</>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						<div className="space-y-2">
							<Label className="font-semibold" style={{ color: "#00453A" }}>
								Report Name
							</Label>
							<Input
								placeholder="Write name here"
								value={reportName}
								onChange={(e) => setReportName(e.target.value)}
								className="border-gray-200"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label className="font-semibold" style={{ color: "#00453A" }}>
								Report Type
							</Label>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{REPORT_TYPES.map((t) => (
									<Button
										key={t.value}
										type="button"
										variant={reportType === t.value ? "default" : "outline"}
										size="sm"
										onClick={() => setReportType(t.value)}
										style={{
											background:
												reportType === t.value ? "#E0F2F1" : undefined,
											borderColor:
												reportType === t.value ? "#00856F" : "rgba(0,0,0,0.1)",
											color: reportType === t.value ? "#00453A" : undefined,
										}}
									>
										{t.label}
									</Button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<Label className="font-semibold" style={{ color: "#00453A" }}>
								Date Of Report
							</Label>
							<Input
								type="date"
								value={dateOfReport}
								onChange={(e) => setDateOfReport(e.target.value)}
								className="border-gray-200"
								required
							/>
						</div>

						<Button
							onClick={handleUpload}
							disabled={!selectedFile || uploadMutation.isPending}
							className="w-full"
							style={{
								background: "#00856F",
								color: "#FFFFFF",
							}}
						>
							{uploadMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="w-4 h-4 mr-2" />
									Upload Report
								</>
							)}
						</Button>
					</div>
				)}
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
