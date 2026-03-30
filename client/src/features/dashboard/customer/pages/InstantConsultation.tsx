import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ConcernCard } from "../../components/ConcernCard";
import { DoctorCard } from "../../components/DoctorCard";
import {
	useSpecialties,
	usePhysiciansBySpecialty,
} from "@/hooks/mutations/usePhysician";
import {
	useCalculateBookingPrice,
	useBookSlot,
} from "@/hooks/mutations/useBooking";
import { useToast } from "@/hooks/use-toast";
import type { Physician } from "@/services/physicianService";
import type { Doctor } from "@/mocks/doctors";
import { formatDate, formatTime12 } from "@/lib/utils";
import { PhysicianAvatar } from "@/components/physician/PhysicianAvatar";
import { ButtonSpinner } from "@/components/ui/spinner";
import dayjs from "dayjs";

type ConsultationStep = "concern" | "doctors" | "confirm";

function mapPhysicianToDoctor(physician: Physician): Doctor {
	return {
		id: physician.id,
		name: [physician.firstName, physician.lastName].filter(Boolean).join(" ") || "Dr. Unknown",
		firstName: physician.firstName ?? "",
		lastName: physician.lastName ?? "",
		specialty: physician.specialty,
		experience: physician.experience,
		rating: physician.rating || 0,
		isOnline: true,
		image: physician.imageUrl || physician.avatar || "",
		consultationFee: parseFloat(physician.consultationFee) || 0,
	};
}

function formatNextSlotLabel(slot: { date: string; startTime: string, endTime: string }): string {
	const d = new Date(slot.date);
	if (isNaN(d.getTime())) return "";
	return `${dayjs(d).format("DD MMM YYYY")}, ${formatTime12(slot.startTime)} - ${formatTime12(slot.endTime)}`;
}

export function InstantConsultation() {
	const [currentStep, setCurrentStep] = useState<ConsultationStep>("concern");
	const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
	const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);

	const { toast } = useToast();
	const { data: specialties = [], isLoading: isLoadingSpecialties } =
		useSpecialties();
	const {
		data: physicians = [],
		isLoading: isLoadingPhysicians,
		refetch: refetchPhysicians,
	} = usePhysiciansBySpecialty(selectedSpecialtyId);

	const { data: bookingPrice, isLoading: isLoadingPrice } =
		useCalculateBookingPrice(selectedPhysician?.id ?? null);
	const bookSlotMutation = useBookSlot();

	const selectedSpecialtyName =
		specialties.find((s) => s.id === selectedSpecialtyId)?.name || "";

	const concerns = specialties.map((specialty) => ({
		id: specialty.id,
		name: specialty.name,
		specialty: specialty.name,
		icon: specialty.icon || "stethoscope",
	}));

	const doctors = physicians.map(mapPhysicianToDoctor);

	const handleConcernSelect = (specialtyId: string) => {
		setSelectedSpecialtyId(specialtyId);
	};

	const handleConsultNow = () => {
		if (selectedSpecialtyId) setCurrentStep("doctors");
	};

	const handleDoctorConsult = (doctor: Doctor) => {
		const physician = physicians.find((p) => p.id === doctor.id);
		if (!physician?.nextAvailableSlot) return;
		setSelectedPhysician(physician);
		setCurrentStep("confirm");
	};

	const handleBackFromDoctors = () => {
		setCurrentStep("concern");
		setSelectedSpecialtyId(null);
	};

	const handleBackFromConfirm = () => {
		setCurrentStep("doctors");
		setSelectedPhysician(null);
	};

	const handleBookAppointment = async () => {
		if (!selectedPhysician?.nextAvailableSlot) return;
		const { slotId, slotTypeId } = selectedPhysician.nextAvailableSlot;
		try {
			await bookSlotMutation.mutateAsync({
				slotId,
				slotTypeId,
				physicianId: selectedPhysician.id,
			});
			setCurrentStep("doctors");
			setSelectedPhysician(null);
			refetchPhysicians()
		} catch (err: unknown) {
			toast({
				title: "Booking failed",
				description: "Failed to book appointment. Please try again",
				variant: "destructive",
			});

		}
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 flex justify-center items-start pt-8 pb-8">
				<div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
					{currentStep === "concern" && (
						<div
							data-testid="section-concern-selection"
							className="flex flex-col min-h-[calc(100vh-4rem)]"
						>
							<div className="flex items-center gap-4 mb-8">
								<h1
									style={{
										fontSize: "28px",
										fontWeight: 600,
										color: "#00453A",
									}}
									data-testid="text-title"
								>
									Select your Concern
								</h1>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 flex-1">
								{isLoadingSpecialties ? (
									<div className="col-span-full text-center py-12">
										<p style={{ fontSize: "16px", color: "#546E7A" }}>
											Loading specialties...
										</p>
									</div>
								) : concerns.length > 0 ? (
									concerns.map((concern) => (
										<ConcernCard
											key={concern.id}
											concern={concern}
											isSelected={selectedSpecialtyId === concern.id}
											onClick={() => handleConcernSelect(concern.id)}
										/>
									))
								) : (
									<div className="col-span-full text-center py-12">
										<p style={{ fontSize: "16px", color: "#546E7A" }}>
											No specialties available.
										</p>
									</div>
								)}
							</div>

							<div className="mt-auto pt-8">
								<Button
									onClick={handleConsultNow}
									disabled={!selectedSpecialtyId}
									className="w-full"
									style={{
										background: selectedSpecialtyId ? "#00856F" : "#B0BEC5",
										color: "#FFFFFF",
										fontWeight: 600,
										fontSize: "16px",
										padding: "16px 32px",
										borderRadius: "8px",
										height: "auto",
										cursor: selectedSpecialtyId ? "pointer" : "not-allowed",
										opacity: selectedSpecialtyId ? 1 : 0.6,
									}}
									data-testid="button-consult-now"
								>
									Consult Now
								</Button>
							</div>
						</div>
					)}

					{currentStep === "doctors" && (
						<div data-testid="section-doctors-list">
							<div className="flex items-center gap-4 mb-8">
								<button
									onClick={handleBackFromDoctors}
									className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
									data-testid="button-back"
									style={{
										background: "#FFFFFF",
										border: "1px solid rgba(0, 0, 0, 0.1)",
									}}
								>
									<ArrowLeft size={24} color="#00453A" />
								</button>
								<h1
									style={{
										fontSize: "28px",
										fontWeight: 600,
										color: "#00453A",
									}}
									data-testid="text-selected-concern"
								>
									{selectedSpecialtyName}
								</h1>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{isLoadingPhysicians ? (
									<div className="col-span-full text-center py-12">
										<p style={{ fontSize: "16px", color: "#546E7A" }}>
											Loading physicians...
										</p>
									</div>
								) : doctors.length > 0 ? (
									doctors.map((doctor) => {
										const physician = physicians.find((p) => p.id === doctor.id);
										const nextSlotLabel = physician?.nextAvailableSlot
											? formatNextSlotLabel(physician.nextAvailableSlot)
											: null;
										return (
											<DoctorCard
												key={doctor.id}
												doctor={doctor}
												onConsultClick={handleDoctorConsult}
												nextSlotLabel={nextSlotLabel ?? undefined}
											/>
										);
									})
								) : (
									<div
										className="col-span-full text-center py-12"
										data-testid="text-no-doctors"
									>
										<p style={{ fontSize: "16px", color: "#546E7A" }}>
											No doctors available for this specialty at the moment.
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{currentStep === "confirm" && selectedPhysician?.nextAvailableSlot && (
						<div data-testid="section-confirm-booking">
							<div className="flex items-center gap-4 mb-8">
								<button
									onClick={handleBackFromConfirm}
									className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
									data-testid="button-back-confirm"
									style={{
										background: "#FFFFFF",
										border: "1px solid rgba(0, 0, 0, 0.1)",
									}}
								>
									<ArrowLeft size={24} color="#00453A" />
								</button>
								<h1
									style={{
										fontSize: "28px",
										fontWeight: 600,
										color: "#00453A",
									}}
								>
									Confirm booking
								</h1>
							</div>

							<Card
								className="p-8 max-w-full "
								style={{
									background: "#FFFFFF",
									border: "1px solid rgba(0, 0, 0, 0.1)",
									borderRadius: "12px",
								}}
							>
								<div className="mb-6 p-4 rounded-lg" style={{ background: "#F7F9F9" }}>
									<p
										className="mb-2 text-xs font-semibold uppercase tracking-wider"
										style={{ color: "#00856F" }}
									>
										Consulting Doctor
									</p>
									<div className="flex items-center gap-3">
										<PhysicianAvatar
											firstName={selectedPhysician.firstName}
											lastName={selectedPhysician.lastName}
											imageUrl={
												selectedPhysician.imageUrl ||
												selectedPhysician.avatar ||
												undefined
											}
											className="h-12 w-12"
											imgClassName="border-2 border-[#E0F2F1]"
										/>
										<div>
											<h4 className="font-semibold text-[#00453A]">
												{selectedPhysician.firstName} {selectedPhysician.lastName}
											</h4>
											<p className="text-sm text-[#00856F]">
												{selectedPhysician.specialty}
											</p>
										</div>
									</div>
								</div>

								<div className="mb-6">
									<p className="text-sm text-[#64748b] mb-1">Time slot</p>
									<p className="font-medium text-[#00453A]">
										{formatNextSlotLabel(selectedPhysician.nextAvailableSlot)}
									</p>
								</div>

								{isLoadingPrice ? (
									<div className="py-4 flex items-center gap-2 text-[#546E7A]">
										<ButtonSpinner className="h-4 w-4" />
										Calculating price...
									</div>
								) : bookingPrice ? (
									<div className="border-t pt-4 space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-[#64748b]">Original fee</span>
											<span className="font-medium">
												PKR{" "}
												{parseFloat(bookingPrice.originalFee).toLocaleString(
													"en-US",
													{
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													},
												)}
											</span>
										</div>
										{bookingPrice.isDiscounted && bookingPrice.discountPercentage != null && (
											<div className="flex justify-between text-sm">
												<span className="text-[#64748b]">Discount applied</span>
												<span className="font-medium text-green-600">
													{bookingPrice.discountPercentage} %
												</span>
											</div>
										)}
										{bookingPrice.isFree && (
											<div className="flex justify-between text-sm">
												<span className="text-[#64748b]">Discount applied</span>
												<span className="font-medium text-green-600">100 %</span>
											</div>
										)}
										<div className="flex justify-between pt-2 border-t font-semibold text-[#00453A]">
											<span>Total</span>
											<span className="text-[#00856F]">
												PKR{" "}
												{parseFloat(bookingPrice.finalPrice).toLocaleString(
													"en-US",
													{
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													},
												)}
											</span>
										</div>
										{bookingPrice.isDiscounted &&
											bookingPrice.discountPercentage != null && (
												<p className="text-xs text-green-600">
													You saved {bookingPrice.discountPercentage}% on this
													consultation
												</p>
											)}
									</div>
								) : (
									<p className="text-sm text-red-600 py-2">
										Unable to load price. Please try again.
									</p>
								)}

								<div className="flex gap-3 mt-6">
									<Button
										variant="outline"
										onClick={handleBackFromConfirm}
										disabled={bookSlotMutation.isPending}
										className="flex-1"
									>
										Back
									</Button>
									<Button
										onClick={handleBookAppointment}
										disabled={
											!bookingPrice || bookSlotMutation.isPending
										}
										className="flex-1"
										style={{
											background:
												bookingPrice && !bookSlotMutation.isPending
													? "#00856F"
													: "#B0BEC5",
											color: "#FFFFFF",
										}}
										data-testid="button-book-appointment"
									>
										{bookSlotMutation.isPending ? (
											<>
												<ButtonSpinner className="mr-2 h-4 w-4" />
												Booking...
											</>
										) : (
											"Book appointment"
										)}
									</Button>
								</div>
							</Card>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
