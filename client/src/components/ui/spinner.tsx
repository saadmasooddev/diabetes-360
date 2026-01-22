import { cn } from "@/lib/utils";

/**
 * Simple Spinner Component
 */
export function Spinner({
	className,
	size = "md",
}: {
	className?: string;
	size?: "sm" | "md" | "lg";
}) {
	const sizeClasses = {
		sm: "h-4 w-4 border-2",
		md: "h-5 w-5 border-2",
		lg: "h-8 w-8 border-3",
	};

	return (
		<div
			className={cn(
				"border-current border-t-transparent rounded-full animate-spin",
				sizeClasses[size],
				className,
			)}
			role="status"
			aria-label="Loading"
		/>
	);
}

/**
 * Button Spinner - Small spinner for buttons
 */
export function ButtonSpinner({ className }: { className?: string }) {
	return <Spinner size="sm" className={className} />;
}

/**
 * Inline Loader - For inline loading states
 */
export function InlineLoader({
	text,
	size = "sm",
}: {
	text?: string;
	size?: "sm" | "md" | "lg";
}) {
	return (
		<div className="flex items-center gap-2 text-sm text-gray-600">
			<Spinner size={size} className="border-teal-600" />
			{text && <span>{text}</span>}
		</div>
	);
}
