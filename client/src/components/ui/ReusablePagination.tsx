import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface ReusablePaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function ReusablePagination({
	currentPage,
	totalPages,
	onPageChange,
	className,
}: ReusablePaginationProps) {
	if (totalPages <= 1) {
		return null;
	}

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (totalPages <= maxVisible) {
			// Show all pages if total pages is less than max visible
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage <= 3) {
				// Near the start
				for (let i = 2; i <= 4; i++) {
					pages.push(i);
				}
				pages.push("ellipsis");
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				// Near the end
				pages.push("ellipsis");
				for (let i = totalPages - 3; i <= totalPages; i++) {
					pages.push(i);
				}
			} else {
				// In the middle
				pages.push("ellipsis");
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push("ellipsis");
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<Pagination className={cn(className)}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
						className={cn(
							"cursor-pointer",
							currentPage === 1 && "pointer-events-none opacity-50",
						)}
					/>
				</PaginationItem>

				{pageNumbers.map((page, index) => {
					if (page === "ellipsis") {
						return (
							<PaginationItem key={`ellipsis-${index}`}>
								<PaginationEllipsis />
							</PaginationItem>
						);
					}

					const pageNum = page as number;
					return (
						<PaginationItem key={pageNum}>
							<PaginationLink
								onClick={() => onPageChange(pageNum)}
								isActive={currentPage === pageNum}
								className="cursor-pointer"
							>
								{pageNum}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				<PaginationItem>
					<PaginationNext
						onClick={() =>
							currentPage < totalPages && onPageChange(currentPage + 1)
						}
						className={cn(
							"cursor-pointer",
							currentPage === totalPages && "pointer-events-none opacity-50",
						)}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
