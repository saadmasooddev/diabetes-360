import { PhysicianData } from "@shared/schema";
import { DoctorCard } from "./DoctorCard";
import { DoctorSearchBar } from "./DoctorSearchBar";
import { SpecialtyTabs } from "./SpecialtyTabs";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { DoctorCardSkeleton } from "@/components/ui/skeletons";
import type { Physician } from "@/services/physicianService";

interface Specialty {
	id: string;
	name: string;
}

interface DoctorSearchStepProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	specialties: Specialty[];
	selectedSpecialtyId: string | null;
	onSpecialtySelect: (specialtyId: string | null) => void;
	isLoadingSpecialties: boolean;
	physicians: (Physician & { practiceStartDate: string })[];
	isLoadingPhysicians: boolean;
	onConsultClick: (physician: Physician) => void;
	pagination?: {
		page: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
}

function mapPhysicianToDoctor(physician: Physician & { practiceStartDate: string }) {
	const practiceStartDate = physician.practiceStartDate || new Date();
	const yearsOfExperience = Math.max(
		1,
		new Date().getFullYear() - new Date(practiceStartDate).getFullYear(),
	);
	return {
		id: physician.id,
		name: physician.firstName + " " + physician.lastName || "Dr. Unknown",
		specialty: physician.specialty || "",
		experience: `${yearsOfExperience}+ years`,
		rating: physician.rating || 0,
		isOnline: physician.isOnline || false,
		image: physician.imageUrl || "",
		consultationFee: parseFloat(physician.consultationFee),
	};
}

export function DoctorSearchStep({
	searchQuery,
	onSearchChange,
	specialties,
	selectedSpecialtyId,
	onSpecialtySelect,
	isLoadingSpecialties,
	physicians,
	isLoadingPhysicians,
	onConsultClick,
	pagination,
	onPageChange,
}: DoctorSearchStepProps) {
	return (
		<div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
			<DoctorSearchBar
				searchQuery={searchQuery}
				onSearchChange={onSearchChange}
			/>

			<SpecialtyTabs
				specialties={specialties}
				selectedSpecialtyId={selectedSpecialtyId}
				onSpecialtySelect={onSpecialtySelect}
				isLoading={isLoadingSpecialties}
			/>

			<div
				className="grid grid-cols-1 lg:grid-cols-2 gap-6"
				data-testid="section-doctors-grid"
			>
				{isLoadingPhysicians ? (
					Array.from({ length: 4 }).map((_, index) => (
						<DoctorCardSkeleton key={`skeleton-${index}`} />
					))
				) : physicians.length > 0 ? (
					physicians.map((physician) => (
						<DoctorCard
							key={physician.id}
							doctor={mapPhysicianToDoctor(physician)}
							onConsultClick={() => onConsultClick(physician)}
							variant="compact"
						/>
					))
				) : (
					<div
						className="col-span-full text-center py-12"
						data-testid="text-no-results"
					>
						<p style={{ fontSize: "16px", color: "#546E7A" }}>
							No doctors found matching your search criteria.
						</p>
					</div>
				)}
			</div>

			{pagination && pagination.totalPages > 1 && (
				<div className="mt-8">
					<ReusablePagination
						currentPage={pagination.page}
						totalPages={pagination.totalPages}
						onPageChange={(page) => {
							onPageChange(page);
							window.scrollTo({ top: 0, behavior: "smooth" });
						}}
					/>
				</div>
			)}
		</div>
	);
}
