import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Button Loading Spinner - Small spinner for buttons
 */
export function ButtonLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin",
        className
      )}
    />
  );
}

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
            index === 0 ? "w-3/4" : index === lines - 1 ? "w-1/2" : "w-full"
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
 * Inline Loading - For inline loading states
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      {text && <span>{text}</span>}
    </div>
  );
}

