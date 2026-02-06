import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useMyConsultations } from "@/hooks/mutations/useBooking";
import { formatDate } from "@/lib/utils";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { Skeleton } from "@/components/ui/skeleton";

interface PastConsultationsListProps {
	limit?: number;
	showSeeAll?: boolean;
}

export function PastConsultationsList({
	limit = 2,
	showSeeAll = true,
}: PastConsultationsListProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [page, setPage] = useState(1);
	const pageLimit = 10;

	const { data: pastData, isLoading: isLoadingPast } = useMyConsultations({
		type: "past",
		page: 1,
		limit,
	});

	const { data: pastAllData, isLoading: isLoadingPastAll } = useMyConsultations(
		{
			type: "past",
			page,
			limit: pageLimit,
		},
	);

	const formatConsultationDate = (dateString: string): string => {
		const date = new Date(dateString);
		return formatDate(date, "MMM dd, yyyy");
	};

	const pastConsultations = pastData?.consultations || [];

	if (isLoadingPast) {
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

	if (pastConsultations.length === 0) {
		return (
			<Card
				className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				No past consultations
			</Card>
		);
	}

	return (
		<>
			{/* Mobile: Card view, Desktop: Table view */}
			<div className="block sm:hidden space-y-3">
				{pastConsultations.map((consultation) => (
					<Card
						key={consultation.id}
						className="p-3 sm:p-4"
						style={{
							background: "#FFFFFF",
							border: "1px solid rgba(0, 0, 0, 0.1)",
							borderRadius: "12px",
						}}
					>
						<div className="space-y-2">
							<div>
								<p className="text-xs text-gray-400 mb-1">Date</p>
								<p className="text-xs text-gray-700 font-medium">
									{formatConsultationDate(
										new Date(consultation.slot.availability.date).toISOString(),
									)}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-1">Provider</p>
								<p className="text-xs text-gray-700">
									{consultation.slot.physician.firstName}{" "}
									{consultation.slot.physician.lastName}{" "}
									{consultation.slot.physician.specialty || ""}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 mb-1">Summary</p>
								<p className="text-xs text-gray-700">
									{consultation.summary || "No summary available"}
								</p>
							</div>
						</div>
					</Card>
				))}
			</div>
			<Card
				className="hidden sm:block p-4 sm:p-6"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Date
								</TableHead>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Provider
								</TableHead>
								<TableHead className="text-gray-500 text-xs sm:text-sm">
									Summary
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pastConsultations.map((consultation) => (
								<TableRow key={consultation.id}>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{formatConsultationDate(
											new Date(
												consultation.slot.availability.date,
											).toISOString(),
										)}
									</TableCell>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{consultation.slot.physician.firstName}{" "}
										{consultation.slot.physician.lastName}{" "}
										{consultation.slot.physician.specialty || ""}
									</TableCell>
									<TableCell className="text-xs sm:text-sm text-gray-700">
										{consultation.summary || "No summary available"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Card>
			{showSeeAll && pastData && pastData.total > limit && (
				<Button
					variant="ghost"
					onClick={() => setIsModalOpen(true)}
					className="mt-3 sm:mt-4 text-teal-600 hover:text-teal-700 text-xs sm:text-sm"
					size="sm"
				>
					See All ({pastData.total})
				</Button>
			)}

			{/* All Past Consultations Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
					<DialogHeader>
						<DialogTitle
							className="text-lg sm:text-xl"
							style={{ color: "#00856F" }}
						>
							All Past Consultations
						</DialogTitle>
					</DialogHeader>
					{isLoadingPastAll ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-20 sm:h-24 w-full" />
							))}
						</div>
					) : pastAllData && pastAllData.consultations.length > 0 ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{/* Mobile: Card view, Desktop: Table view */}
							<div className="block sm:hidden space-y-3">
								{pastAllData.consultations.map((consultation) => (
									<Card
										key={consultation.id}
										className="p-3"
										style={{
											background: "#FFFFFF",
											border: "1px solid rgba(0, 0, 0, 0.1)",
											borderRadius: "12px",
										}}
									>
										<div className="space-y-2">
											<div>
												<p className="text-xs text-gray-400 mb-1">Date</p>
												<p className="text-xs text-gray-700 font-medium">
													{formatConsultationDate(
														new Date(
															consultation.slot.availability.date,
														).toISOString(),
													)}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-400 mb-1">Provider</p>
												<p className="text-xs text-gray-700">
													{consultation.slot.physician.firstName}{" "}
													{consultation.slot.physician.lastName}{" "}
													{consultation.slot.physician.specialty || ""}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-400 mb-1">Summary</p>
												<p className="text-xs text-gray-700">
													{consultation.summary || "No summary available"}
												</p>
											</div>
										</div>
									</Card>
								))}
							</div>
							<div className="hidden sm:block overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Date
											</TableHead>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Provider
											</TableHead>
											<TableHead className="text-gray-500 text-xs sm:text-sm">
												Summary
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pastAllData.consultations.map((consultation) => (
											<TableRow key={consultation.id}>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{formatConsultationDate(
														new Date(
															consultation.slot.availability.date,
														).toISOString(),
													)}
												</TableCell>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{consultation.slot.physician.firstName}{" "}
													{consultation.slot.physician.lastName}{" "}
													{consultation.slot.physician.specialty || ""}
												</TableCell>
												<TableCell className="text-xs sm:text-sm text-gray-700">
													{consultation.summary || "No summary available"}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							{pastAllData.total > pageLimit && (
								<div className="mt-3 sm:mt-4">
									<ReusablePagination
										currentPage={page}
										totalPages={Math.ceil(pastAllData.total / pageLimit)}
										onPageChange={setPage}
									/>
								</div>
							)}
						</div>
					) : (
						<p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
							No past consultations
						</p>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
