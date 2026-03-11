import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { usePhysiciansPaginated } from "@/hooks/mutations/usePhysician";
import { formatDate, formatTime12 } from "@/lib/utils";
import { ROUTES } from "@/config/routes";
import { Star, Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Physician } from "@/services/physicianService";
import { PastConsultationsList } from "../../components/PastConsultationsList";
import { UserConsultation } from "server/src/modules/booking/repository/booking.repository";

export function Consultations() {
	const [, setLocation] = useLocation();
	const [selectedConsultation, setSelectedConsultation] =
		useState<UserConsultation | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
	const [isPastModalOpen, setIsPastModalOpen] = useState(false);
	const [upcomingPage, setUpcomingPage] = useState(1);
	const [pastPage, setPastPage] = useState(1);

	const pageLimit = 10;

	// Fetch upcoming consultations (most recent one for display, all for modal)
	const { data: upcomingData, isLoading: isLoadingUpcoming } =
		useMyConsultations({
			type: "upcoming",
			page: 1,
			limit: 1,
		});

	const { data: upcomingAllData, isLoading: isLoadingUpcomingAll } =
		useMyConsultations({
			type: "upcoming",
			page: upcomingPage,
			limit: pageLimit,
		});

	// Fetch past consultations (last 2 for display, all for modal)
	const { data: pastData, isLoading: isLoadingPast } = useMyConsultations({
		type: "past",
		page: 1,
		limit: 2,
	});

	const { data: pastAllData, isLoading: isLoadingPastAll } = useMyConsultations(
		{
			type: "past",
			page: pastPage,
			limit: pageLimit,
		},
	);

	// Fetch recommended physicians (5 minimum: 2 highest rated, 3 random)
	const { data: physiciansData } = usePhysiciansPaginated({
		page: 1,
		limit: 50, // Get more to filter
	});

	const handleViewDetails = (consultation: UserConsultation) => {
		setSelectedConsultation(consultation);
		setIsDetailsModalOpen(true);
	};

	const handleBookNewConsultation = () => {
		setLocation(ROUTES.FIND_DOCTOR);
	};

	// Get recommended physicians (2 highest rated + 3 random)
	const getRecommendedPhysicians = (): Physician[] => {
		if (!physiciansData?.physicians || physiciansData.physicians.length === 0) {
			return [];
		}

		const physicians = [...physiciansData.physicians];

		// Sort by rating and get top 2
		const sortedByRating = physicians.sort(
			(a, b) => (b.rating || 0) - (a.rating || 0),
		);
		const topRated = sortedByRating.slice(0, 2);

		// Get remaining physicians and pick 3 random
		const remaining = sortedByRating.slice(2);
		const shuffled = remaining.sort(() => Math.random() - 0.5);
		const random = shuffled.slice(0, 3);

		// Combine and ensure we have at least 5
		const recommended = [...topRated, ...random];

		// If we have less than 5, fill with more from the list
		if (recommended.length < 5 && physicians.length > recommended.length) {
			const additional = physicians
				.filter((p) => !recommended.find((r) => r.id === p.id))
				.slice(0, 5 - recommended.length);
			recommended.push(...additional);
		}

		return recommended.slice(0, 5);
	};

	const recommendedPhysicians = getRecommendedPhysicians();

	const formatConsultationDate = (dateString: string): string => {
		const date = new Date(dateString);
		return formatDate(date, "MMM dd, yyyy");
	};

	const formatConsultationTime = (
		dateString: string,
		startTime: string,
		endTime: string,
	): string => {
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const year = date.getFullYear();
		return `${day}/${month}/${year} - ${formatTime12(startTime)}`;
	};

	const renderStars = (rating: number) => {
		return [...Array(5)].map((_, i) => {
			const starValue = i + 1;
			const filled = starValue <= Math.round(rating);
			return (
				<Star
					key={i}
					size={14}
					fill={filled ? "#00856F" : "none"}
					stroke={filled ? "#00856F" : "#B0BEC5"}
					className="inline-block"
				/>
			);
		});
	};

	const upcomingConsultation = upcomingData?.consultations?.[0] || null;
	const pastConsultations = pastData?.consultations || [];

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 p-4 lg:p-12 overflow-auto w-full">
				<div className="w-full space-y-6 ">
					{/* Header */}
					<div className="mb-4 sm:mb-6">
						<h1
							className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
							style={{ color: "#00856F" }}
						>
							Consultations
						</h1>
						<p className="text-xs sm:text-sm lg:text-base text-gray-600">
							Talk to our care experts and get guidance that truly understands
							your journey.
						</p>
					</div>

					{/* Upcoming Consultations Section */}
					<div className="mb-6 sm:mb-8">
						<h2
							className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
							style={{ color: "#00856F" }}
						>
							Upcoming Consultations
						</h2>
						{isLoadingUpcoming ? (
							<Card className="p-4 sm:p-6">
								<Skeleton className="h-32 w-full" />
							</Card>
						) : upcomingConsultation ? (
							<Card
								className="p-3 sm:p-4 lg:p-6"
								style={{
									background: "#FFFFFF",
									border: "1px solid rgba(0, 0, 0, 0.1)",
									borderRadius: "12px",
								}}
							>
								<div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
									<div className="flex-1">
										<h3
											className="text-base sm:text-lg font-semibold mb-1"
											style={{ color: "#00856F" }}
										>
											{upcomingConsultation.slot.physician.firstName}{" "}
											{upcomingConsultation.slot.physician.lastName}
										</h3>
										<p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
											{upcomingConsultation.slot.physician.specialty ||
												"Physician"}
										</p>
										<div className="space-y-2 mb-3 sm:mb-4">
											<div className="flex items-start gap-2">
												{upcomingConsultation.slot.location?.locationName && (
													<>
														<MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-gray-400" />
														<div className="min-w-0 flex-1">
															<p className="text-xs text-gray-400">Location</p>
															<p className="text-xs sm:text-sm text-gray-700 break-words">
																{`${upcomingConsultation.slot.location.locationName}${upcomingConsultation.slot.location.address ? `, ${upcomingConsultation.slot.location.address}` : ""}`}
															</p>
														</div>
													</>
												)}
											</div>
											<div className="flex items-start gap-2">
												<Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-gray-400" />
												<div className="min-w-0 flex-1">
													<p className="text-xs text-gray-400">Date & Time</p>
													<p className="text-xs sm:text-sm text-gray-700">
														{formatConsultationTime(
															new Date(
																upcomingConsultation.slot.availability.date,
															).toISOString(),
															upcomingConsultation.slot.startTime,
															upcomingConsultation.slot.endTime,
														)}
													</p>
												</div>
											</div>
										</div>
										<Button
											onClick={() => handleViewDetails(upcomingConsultation)}
											style={{ background: "#00856F", color: "#FFFFFF" }}
											className="w-full sm:w-auto text-sm sm:text-base"
											size="sm"
										>
											View Details
										</Button>
									</div>
								</div>
							</Card>
						) : (
							<Card className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
								No upcoming consultations
							</Card>
						)}
						{upcomingData && upcomingData.total > 1 && (
							<Button
								variant="ghost"
								onClick={() => setIsUpcomingModalOpen(true)}
								className="mt-3 sm:mt-4 text-teal-600 hover:text-teal-700 text-xs sm:text-sm"
								size="sm"
							>
								See All ({upcomingData.total})
							</Button>
						)}
					</div>

					{/* Past Consultations Section */}
					<div className="mb-6 sm:mb-8">
						<h2
							className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
							style={{ color: "#00856F" }}
						>
							Past Consultations
						</h2>
						{isLoadingPast && (
							<div className="space-y-3 sm:space-y-4">
								{[1, 2].map((i) => (
									<Card key={i} className="p-4 sm:p-6">
										<Skeleton className="h-20 w-full" />
									</Card>
								))}
							</div>
						)}
						{pastConsultations && pastConsultations.length > 0 && (
							<PastConsultationsList
								limit={2}
								showSeeAll={pastConsultations.length > 3}
							/>
						)}
						{pastConsultations && pastConsultations.length === 0 && (
							<Card className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
								No past consultations
							</Card>
						)}
					</div>

					{/* Recommended Experts Section */}
					<div className="mb-6 sm:mb-8">
						<h2
							className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
							style={{ color: "#00856F" }}
						>
							Recommended Experts
						</h2>
						<div
							className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 -mx-2 sm:mx-0 px-2 sm:px-0"
							style={{
								scrollbarWidth: "thin",
								scrollbarColor: "#E0F2F1 transparent",
							}}
						>
							{recommendedPhysicians.length > 0 ? (
								recommendedPhysicians.map((physician) => (
									<Card
										key={physician.id}
										className="flex-shrink-0 w-48 sm:w-56 lg:w-64 p-3 sm:p-4"
										style={{
											background: "#FFFFFF",
											border: "1px solid rgba(0, 0, 0, 0.1)",
											borderRadius: "12px",
										}}
									>
										<div className="flex flex-col items-center text-center">
											<div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 sm:mb-3">
												<Image
													src={physician.imageUrl || ""}
													alt={`${physician.firstName} ${physician.lastName}`}
													className="w-full h-full rounded-full object-cover"
													pointToServer={true}
													style={{ border: "3px solid #E0F2F1" }}
												/>
											</div>
											<h3
												className="font-semibold mb-1 text-sm sm:text-base"
												style={{ color: "#00856F" }}
											>
												{physician.firstName} {physician.lastName}
											</h3>
											<p className="text-xs text-gray-500 mb-1">
												{physician.specialty || "Physician"}
											</p>
											<p className="text-xs text-gray-500 mb-2">
												{physician.experience || "1+ years"}
											</p>
											<div className="flex items-center justify-center gap-0.5">
												{renderStars(physician.rating || 0)}
											</div>
										</div>
									</Card>
								))
							) : (
								<p className="text-sm text-gray-500 text-center w-full py-4">
									No recommended experts available
								</p>
							)}
						</div>
					</div>

					{/* Book New Consultation Button */}
					<div className="mb-6 sm:mb-8">
						<Button
							onClick={handleBookNewConsultation}
							className="w-full text-sm sm:text-base"
							style={{
								background: "#00856F",
								color: "#FFFFFF",
								height: "44px",
								minHeight: "44px",
							}}
							size="lg"
						>
							Book New Consultation
						</Button>
					</div>
				</div>
			</main>

			{/* Consultation Details Modal */}
			<Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
				<DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
					<DialogHeader>
						<DialogTitle
							className="text-lg sm:text-xl"
							style={{ color: "#00856F" }}
						>
							Consultation Details
						</DialogTitle>
					</DialogHeader>
					{selectedConsultation && (
						<div className="space-y-4 p-4 sm:p-6">
							<div>
								<h3
									className="font-semibold mb-2 text-base sm:text-lg"
									style={{ color: "#00856F" }}
								>
									{selectedConsultation.slot.physician.firstName}{" "}
									{selectedConsultation.slot.physician.lastName}
								</h3>
								<p className="text-xs sm:text-sm text-gray-500 mb-4">
									{selectedConsultation.slot.physician.specialty || "Physician"}
								</p>
							</div>
							<div className="space-y-3">
								<div className="flex items-start gap-2">
									<Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
									<div className="min-w-0 flex-1">
										<p className="text-xs text-gray-400">Date</p>
										<p className="text-xs sm:text-sm text-gray-700">
											{formatConsultationDate(
												new Date(
													selectedConsultation.slot.availability.date,
												).toISOString(),
											)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-2">
									<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
									<div className="min-w-0 flex-1">
										<p className="text-xs text-gray-400">Time</p>
										<p className="text-xs sm:text-sm text-gray-700">
											{formatTime12(selectedConsultation.slot.startTime)} -{" "}
											{formatTime12(selectedConsultation.slot.endTime)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-2">
									{selectedConsultation.slot.location?.locationName && (
										<>
											<MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
											<div className="min-w-0 flex-1">
												<p className="text-xs text-gray-400">Location</p>
												<p className="text-xs sm:text-sm text-gray-700 break-words">
													{`${selectedConsultation.slot.location.locationName}${selectedConsultation.slot.location.address ? `, ${selectedConsultation.slot.location.address}` : ""}`}
												</p>
											</div>
										</>
									)}
								</div>
								<div>
									<p className="text-xs text-gray-400 mb-1">
										Consultation Type
									</p>
									<p className="text-xs sm:text-sm text-gray-700 capitalize">
										{selectedConsultation.slot.slotType.type}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-400 mb-1">Status</p>
									<p className="text-xs sm:text-sm text-gray-700 capitalize">
										{selectedConsultation.status}
									</p>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* All Upcoming Consultations Modal */}
			<Dialog open={isUpcomingModalOpen} onOpenChange={setIsUpcomingModalOpen}>
				<DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
					<DialogHeader>
						<DialogTitle
							className="text-lg sm:text-xl"
							style={{ color: "#00856F" }}
						>
							All Upcoming Consultations
						</DialogTitle>
					</DialogHeader>
					{isLoadingUpcomingAll ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-20 sm:h-24 w-full" />
							))}
						</div>
					) : upcomingAllData && upcomingAllData.consultations.length > 0 ? (
						<div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
							{upcomingAllData.consultations.map((consultation) => (
								<Card
									key={consultation.id}
									className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
									onClick={() => {
										setSelectedConsultation(consultation);
										setIsUpcomingModalOpen(false);
										setIsDetailsModalOpen(true);
									}}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h3
												className="font-semibold mb-1 text-sm sm:text-base"
												style={{ color: "#00856F" }}
											>
												{consultation.slot.physician.firstName}{" "}
												{consultation.slot.physician.lastName}
											</h3>
											<p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
												{consultation.slot.physician.specialty || "Physician"}
											</p>
											<p className="text-xs text-gray-600">
												{formatConsultationTime(
													new Date(
														consultation.slot.availability.date,
													).toISOString(),
													consultation.slot.startTime,
													consultation.slot.endTime,
												)}
											</p>
										</div>
										<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
									</div>
								</Card>
							))}
							{upcomingAllData.total > pageLimit && (
								<div className="mt-3 sm:mt-4">
									<ReusablePagination
										currentPage={upcomingPage}
										totalPages={Math.ceil(upcomingAllData.total / pageLimit)}
										onPageChange={setUpcomingPage}
									/>
								</div>
							)}
						</div>
					) : (
						<p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
							No upcoming consultations
						</p>
					)}
				</DialogContent>
			</Dialog>

			{/* All Past Consultations Modal */}
			<Dialog open={isPastModalOpen} onOpenChange={setIsPastModalOpen}>
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
										currentPage={pastPage}
										totalPages={Math.ceil(pastAllData.total / pageLimit)}
										onPageChange={setPastPage}
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
		</div>
	);
}
