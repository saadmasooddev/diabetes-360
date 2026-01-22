import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadAreaProps {
	previewUrl: string | null;
	onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onUploadClick: () => void;
	onScanClick: () => void;
	isScanning?: boolean;
	isPending?: boolean;
	canScan?: boolean;
	limitMessage?: string;
}

export function UploadArea({
	previewUrl,
	onFileSelect,
	onUploadClick,
	onScanClick,
	isScanning = false,
	isPending = false,
	canScan = true,
	limitMessage,
}: UploadAreaProps) {
	return (
		<div className="flex flex-col items-center max-w-[800px] mx-auto">
			{/* Upload/Scanning Area */}
			<Card
				className={`w-full mb-8 relative overflow-hidden ${!previewUrl ? "cursor-pointer hover:border-[#00856F]" : ""} transition-colors`}
				style={{
					background: "#FFFFFF",
					border: "2px dashed rgba(0, 0, 0, 0.1)",
					borderRadius: "24px",
					minHeight: "400px",
					padding: "0",
				}}
				onClick={!previewUrl ? onUploadClick : undefined}
				data-testid="card-upload-area"
			>
				{previewUrl ? (
					<div className="relative w-full h-full min-h-[400px]">
						<img
							src={previewUrl}
							alt="Preview"
							className="w-full h-full object-cover rounded-[24px]"
							style={{
								filter: isScanning ? "grayscale(70%) brightness(0.8)" : "none",
							}}
							data-testid="img-preview"
						/>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 min-h-[400px] p-12">
						<div
							className="flex items-center justify-center rounded-full"
							style={{
								width: "120px",
								height: "120px",
								background: "#F7F9F9",
							}}
							data-testid="icon-upload-container"
						>
							<Upload size={48} color="#00856F" strokeWidth={2} />
						</div>
						<p
							style={{
								fontSize: "16px",
								fontWeight: 500,
								color: "#546E7A",
							}}
							data-testid="text-upload-instruction"
						>
							Click to upload a food picture
						</p>
					</div>
				)}
			</Card>

			{/* Action Button */}
			{!previewUrl ? (
				<Button
					onClick={onUploadClick}
					className="w-full max-w-[400px]"
					style={{
						background: "#00856F",
						color: "#FFFFFF",
						fontWeight: 600,
						fontSize: "16px",
						padding: "16px 32px",
						borderRadius: "8px",
						height: "auto",
					}}
					data-testid="button-upload-picture"
				>
					Upload Picture
				</Button>
			) : !isScanning ? (
				<>
					<Button
						onClick={onScanClick}
						disabled={isPending || !canScan}
						className="w-full max-w-[400px]"
						style={{
							background: canScan ? "#00856F" : "#9E9E9E",
							color: "#FFFFFF",
							fontWeight: 600,
							fontSize: "16px",
							padding: "16px 32px",
							borderRadius: "8px",
							height: "auto",
							cursor: canScan ? "pointer" : "not-allowed",
						}}
						data-testid="button-scan"
					>
						{canScan ? "Scan" : "Limit Reached"}
					</Button>
					{limitMessage && (
						<p
							className="mt-3 text-sm text-center text-red-600 max-w-[400px]"
							data-testid="text-limit-message"
						>
							{limitMessage}
						</p>
					)}
				</>
			) : (
				<Button
					disabled
					className="w-full max-w-[400px]"
					style={{
						background: "#00856F",
						color: "#FFFFFF",
						fontWeight: 600,
						fontSize: "16px",
						padding: "16px 32px",
						borderRadius: "8px",
						height: "auto",
						opacity: 0.8,
					}}
					data-testid="button-scanning"
				>
					Scanning..
				</Button>
			)}
		</div>
	);
}
