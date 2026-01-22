import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LimitReachedDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpgrade: () => void;
}

export function LimitReachedDialog({
	open,
	onOpenChange,
	onUpgrade,
}: LimitReachedDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				style={{
					background: "#FFFFFF",
					borderRadius: "12px",
					padding: "24px",
				}}
			>
				<DialogHeader>
					<DialogTitle
						style={{ color: "#00453A", fontSize: "20px", fontWeight: 600 }}
					>
						Daily Limit Reached
					</DialogTitle>
					<p style={{ color: "#546E7A", fontSize: "14px", marginTop: "8px" }}>
						Free tier users are limited to 2 logs per day. Upgrade to a paid
						plan for unlimited logging and premium features.
					</p>
				</DialogHeader>
				<div className="flex gap-3 mt-4">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						style={{
							flex: 1,
							border: "1px solid #E0E0E0",
							borderRadius: "8px",
							color: "#00453A",
							fontSize: "14px",
							fontWeight: 500,
						}}
					>
						Close
					</Button>
					<Button
						onClick={() => {
							onUpgrade();
							onOpenChange(false);
						}}
						style={{
							flex: 1,
							background: "#00856F",
							color: "#FFFFFF",
							borderRadius: "8px",
							fontSize: "14px",
							fontWeight: 600,
							border: "none",
						}}
					>
						Upgrade to Paid Plan
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
