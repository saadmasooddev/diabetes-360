import { Skeleton } from "../skeleton";
import { cn } from "@/lib/utils";

/**
 * Table Row Skeleton - For loading table data
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
	return (
		<>
			{Array.from({ length: columns }).map((_, index) => (
				<div key={index} className="px-4 py-3">
					<Skeleton className="h-4 w-full max-w-[120px]" />
				</div>
			))}
		</>
	);
}

/**
 * Card Skeleton - For loading card content
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: lines }).map((_, index) => (
				<Skeleton
					key={index}
					className={cn(
						"h-4",
						index === 0 ? "w-3/4" : index === lines - 1 ? "w-1/2" : "w-full",
					)}
				/>
			))}
		</div>
	);
}

/**
 * List Item Skeleton - For loading list items
 */
export function ListItemSkeleton() {
	return (
		<div className="flex items-center space-x-3 p-3">
			<Skeleton className="h-10 w-10 rounded-full" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</div>
		</div>
	);
}

/**
 * Doctor Card Skeleton - For loading doctor cards
 */
export function DoctorCardSkeleton() {
	return (
		<div className="border rounded-lg p-6 space-y-4">
			<div className="flex items-start gap-4">
				<Skeleton className="h-16 w-16 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
		</div>
	);
}

/**
 * Slot Card Skeleton - For loading slot cards
 */
export function SlotCardSkeleton() {
	return (
		<div className="p-4 rounded-lg border space-y-2">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-3 w-16" />
		</div>
	);
}
