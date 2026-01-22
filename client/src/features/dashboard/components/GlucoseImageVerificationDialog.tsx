import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, Check, X } from "lucide-react";
import { ButtonSpinner } from "@/components/ui/spinner";
import { handleNumberInput } from "@/lib/utils";

interface GlucoseImageVerificationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bloodSugarReading: string;
	imagePreview?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isSubmitting: boolean;
	onReadingChange: (r: string) => void;
}

export function GlucoseImageVerificationDialog({
	open,
	onOpenChange,
	bloodSugarReading,
	imagePreview,
	onConfirm,
	onCancel,
	isSubmitting,
	onReadingChange,
}: GlucoseImageVerificationDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md overflow-hidden"
				style={{
					background: "#FFFFFF",
					borderRadius: "16px",
					padding: 0,
					border: "1px solid rgba(0, 133, 111, 0.12)",
					boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
				}}
			>
				{/* Header with gradient */}
				<div
					style={{
						background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
						padding: "24px 28px",
						borderBottom: "2px solid #4CAF5030",
					}}
				>
					<DialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div
								style={{
									background: "#FFFFFF",
									borderRadius: "12px",
									padding: "10px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
								}}
							>
								<Activity size={24} style={{ color: "#4CAF50" }} />
							</div>
							<DialogTitle
								style={{
									color: "#00453A",
									fontSize: "22px",
									fontWeight: 700,
									margin: 0,
								}}
							>
								Verify Glucose Reading
							</DialogTitle>
						</div>
						<DialogDescription
							style={{
								color: "#546E7A",
								fontSize: "14px",
								marginTop: "4px",
							}}
						>
							Please verify the extracted reading from your glucose meter image
						</DialogDescription>
					</DialogHeader>
				</div>

				{/* Content */}
				<div className="space-y-6 p-6">
					{imagePreview && (
						<div className="flex justify-center">
							<img
								src={imagePreview}
								alt="Glucose meter reading"
								className="rounded-lg border-2 border-gray-200 max-h-48 object-contain"
								style={{
									maxWidth: "100%",
								}}
							/>
						</div>
					)}

					<div
						style={{
							background: "linear-gradient(135deg, #F1F8F4 0%, #E8F5E9 100%)",
							borderRadius: "12px",
							padding: "20px",
							border: "2px solid #4CAF5030",
						}}
					>
						<div className="text-center">
							<p
								style={{
									color: "#546E7A",
									fontSize: "14px",
									fontWeight: 500,
									marginBottom: "8px",
								}}
							>
								Extracted Reading (mg/dL)
							</p>
							<div className="flex items-center justify-center gap-2">
								<div className=" bg-red-200 ">
									<input
										type="text"
										value={bloodSugarReading}
										onChange={(e) => {
											const sanitized = handleNumberInput(
												bloodSugarReading,
												e.target.value,
											);
											onReadingChange(sanitized);
										}}
										className=" w-full text-center border-none outline-none  "
										style={{
											color: "#00453A",
											fontSize: "36px",
											fontWeight: 700,
											background:
												"linear-gradient(135deg, #F1F8F4 0%, #E8F5E9 100%)",
										}}
									/>
								</div>
							</div>
						</div>
					</div>

					<p
						style={{
							color: "#546E7A",
							fontSize: "14px",
							textAlign: "center",
							lineHeight: "1.5",
						}}
					>
						Is this reading correct? If yes, click "Confirm" to log it.
						Otherwise, click "Cancel" to try again.
					</p>
				</div>

				{/* Footer */}
				<DialogFooter className="gap-2 p-6 pt-0">
					<Button
						onClick={onCancel}
						disabled={isSubmitting}
						variant="outline"
						className="flex-1 transition-all duration-300 hover:scale-[1.02]"
						style={{
							border: "1.5px solid rgba(0, 133, 111, 0.3)",
							borderRadius: "12px",
							fontSize: "16px",
							fontWeight: 600,
							padding: "14px",
							color: "#00856F",
							background: "#FFFFFF",
						}}
					>
						<X className="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={isSubmitting}
						className="flex-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
						style={{
							background: "linear-gradient(135deg, #00856F 0%, #006B5C 100%)",
							color: "#FFFFFF",
							borderRadius: "12px",
							fontSize: "16px",
							fontWeight: 600,
							padding: "14px",
							border: "none",
							boxShadow: "0 4px 12px rgba(0, 133, 111, 0.3)",
						}}
					>
						{isSubmitting ? (
							<>
								<ButtonSpinner className="mr-2" />
								Logging...
							</>
						) : (
							<>
								<Check className="mr-2 h-4 w-4" />
								Confirm
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
