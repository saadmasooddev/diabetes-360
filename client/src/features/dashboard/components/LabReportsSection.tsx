import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	useLabReports,
	useUploadLabReport,
	useUpdateLabReport,
	useDeleteLabReport,
	useDownloadLabReport,
} from "@/hooks/mutations/useMedical";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Upload,
	Download,
	Trash2,
	Edit,
	FileText,
	Loader2,
} from "lucide-react";
import type { LabReport } from "@/services/medicalService";

export function LabReportsSection() {
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const updateFileInputRef = useRef<HTMLInputElement>(null);

	const { data, isLoading } = useLabReports({ limit: 100, offset: 0 });
	const reports = data?.reports ?? [];
	const uploadMutation = useUploadLabReport();
	const updateMutation = useUpdateLabReport();
	const deleteMutation = useDeleteLabReport();
	const downloadMutation = useDownloadLabReport();

	const allowedMimeTypes = [
		"application/pdf",
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	];

	const handleUploadClick = () => {
		setIsUploadModalOpen(true);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!allowedMimeTypes.includes(file.type)) {
				alert("File Type Not Allowed");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("File size must be less than 10MB");
				return;
			}
			uploadMutation.mutate(file, {
				onSuccess: () => {
					setIsUploadModalOpen(false);
					if (fileInputRef.current) {
						fileInputRef.current.value = "";
					}
				},
			});
		}
	};

	const handleUpdateClick = (report: LabReport) => {
		setSelectedReport(report);
		setIsUpdateModalOpen(true);
	};

	const handleUpdateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && selectedReport) {
			if (!allowedMimeTypes.includes(file.type)) {
				alert("File Type Not Allowed");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("File size must be less than 10MB");
				return;
			}
			updateMutation.mutate(
				{ reportId: selectedReport.id, file },
				{
					onSuccess: () => {
						setIsUpdateModalOpen(false);
						setSelectedReport(null);
						if (updateFileInputRef.current) {
							updateFileInputRef.current.value = "";
						}
					},
				},
			);
		}
	};

	const handleDeleteClick = (report: LabReport) => {
		if (confirm("Are you sure you want to delete this lab report?")) {
			deleteMutation.mutate(report.id);
		}
	};

	const handleDownloadClick = (report: LabReport) => {
		downloadMutation.mutate(report.id);
	};

	const formatUploadDate = (dateString: string): string => {
		const date = new Date(dateString);
		return formatDate(date, "MMM dd, yyyy");
	};

	const formatFileSize = (size: string): string => {
		const bytes = parseInt(size);
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	};

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

	if (reports.length === 0) {
		return (
			<>
				<Card
					className="p-6 flex items-center justify-between"
					style={{
						background: "#FFFFFF",
						borderRadius: "12px",
						border: "1px solid rgba(0, 0, 0, 0.1)",
					}}
					data-testid="card-lab-reports-empty"
				>
					<p
						style={{
							fontSize: "16px",
							fontWeight: 400,
							color: "#546E7A",
						}}
					>
						No reports uploaded. Tap{" "}
						<span style={{ color: "#00856F", fontWeight: 600 }}>
							Upload Report
						</span>{" "}
						to add your latest bloodwork or scans.
					</p>
					<Button
						onClick={handleUploadClick}
						style={{
							background: "#00856F",
							color: "#FFFFFF",
							fontWeight: 600,
							fontSize: "14px",
							borderRadius: "8px",
							padding: "12px 24px",
							height: "auto",
						}}
						data-testid="button-upload-report"
					>
						Upload Report
					</Button>
				</Card>

				{/* Upload Modal */}
				<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle style={{ color: "#00856F" }}>
								Upload Lab Report
							</DialogTitle>
							<DialogDescription>
								Please select a file file to upload (max 10MB)
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<input
								ref={fileInputRef}
								type="file"
								accept={allowedMimeTypes.join(",")}
								onChange={handleFileSelect}
								className="hidden"
								id="lab-report-upload"
							/>
							<label
								htmlFor="lab-report-upload"
								className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
							>
								<Upload className="w-8 h-8 text-gray-400 mb-2" />
								<p className="text-sm text-gray-600">Click to upload file</p>
								<p className="text-xs text-gray-400 mt-1">Max 10MB</p>
							</label>
							{uploadMutation.isPending && (
								<div className="flex items-center justify-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<p className="text-sm text-gray-600">Uploading...</p>
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			</>
		);
	}

	return (
		<>
			<Card
				style={{
					background: "#FFFFFF",
					borderRadius: "12px",
					border: "1px solid rgba(0, 0, 0, 0.1)",
				}}
			>
				<div className="p-4 sm:p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold" style={{ color: "#00856F" }}>
							Lab Reports ({reports.length})
						</h3>
						<Button
							onClick={handleUploadClick}
							size="sm"
							style={{
								background: "#00856F",
								color: "#FFFFFF",
							}}
						>
							<Upload className="w-4 h-4 mr-2" />
							Upload
						</Button>
					</div>
					<div className="space-y-3">
						{reports.map((report) => (
							<div
								key={report.id}
								className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
							>
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<div
										className="flex items-center justify-center rounded-lg"
										style={{
											width: "40px",
											height: "40px",
											background: "#E0F2F1",
										}}
									>
										<FileText
											className="w-5 h-5"
											style={{ color: "#00856F" }}
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p
											className="text-sm font-medium truncate"
											style={{ color: "#00453A" }}
											title={report.reportName || report.fileName}
										>
											{report.reportName || report.fileName}
										</p>
										<p className="text-xs text-gray-500">
											{formatUploadDate(report.uploadedAt)} •{" "}
											{formatFileSize(report.fileSize)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 ml-4">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDownloadClick(report)}
										disabled={downloadMutation.isPending}
										className="h-8 w-8 p-0"
										title="Download"
									>
										{downloadMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Download
												className="h-4 w-4"
												style={{ color: "#00856F" }}
											/>
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleUpdateClick(report)}
										disabled={updateMutation.isPending}
										className="h-8 w-8 p-0"
										title="Update"
									>
										<Edit className="h-4 w-4" style={{ color: "#00856F" }} />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteClick(report)}
										disabled={deleteMutation.isPending}
										className="h-8 w-8 p-0"
										title="Delete"
									>
										{deleteMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2
												className="h-4 w-4"
												style={{ color: "#F44336" }}
											/>
										)}
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			</Card>

			{/* Upload Modal */}
			<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle style={{ color: "#00856F" }}>
							Upload Lab Report
						</DialogTitle>
						<DialogDescription>
							Please select a file to upload (max 10MB)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<input
							ref={fileInputRef}
							type="file"
							accept={allowedMimeTypes.join(",")}
							onChange={handleFileSelect}
							className="hidden"
							id="lab-report-upload"
						/>
						<label
							htmlFor="lab-report-upload"
							className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
						>
							<Upload className="w-8 h-8 text-gray-400 mb-2" />
							<p className="text-sm text-gray-600">Click to upload file</p>
							<p className="text-xs text-gray-400 mt-1">Max 10MB</p>
						</label>
						{uploadMutation.isPending && (
							<div className="flex items-center justify-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								<p className="text-sm text-gray-600">Uploading...</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Update Modal */}
			<Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle style={{ color: "#00856F" }}>
							Update Lab Report
						</DialogTitle>
						<DialogDescription>
							Replace the current file with a new file(max 10MB)
						</DialogDescription>
					</DialogHeader>
					{selectedReport && (
						<div className="space-y-4">
							<div className="p-3 bg-gray-50 rounded-lg">
								<p className="text-sm font-medium" style={{ color: "#00453A" }}>
									Current: {selectedReport.fileName}
								</p>
								<p className="text-xs text-gray-500 mt-1">
									Uploaded: {formatUploadDate(selectedReport.uploadedAt)}
								</p>
							</div>
							<input
								ref={updateFileInputRef}
								type="file"
								accept={allowedMimeTypes.join(",")}
								onChange={handleUpdateFileSelect}
								className="hidden"
								id="lab-report-update"
							/>
							<label
								htmlFor="lab-report-update"
								className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
							>
								<Upload className="w-8 h-8 text-gray-400 mb-2" />
								<p className="text-sm text-gray-600">
									Click to select new file
								</p>
								<p className="text-xs text-gray-400 mt-1">Max 10MB</p>
							</label>
							{updateMutation.isPending && (
								<div className="flex items-center justify-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<p className="text-sm text-gray-600">Updating...</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
