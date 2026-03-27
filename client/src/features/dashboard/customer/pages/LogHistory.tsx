import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ReusablePagination } from "@/components/ui/ReusablePagination";
import { useFilteredMetricsPaginated } from "@/hooks/mutations/useHealth";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { METRIC_TYPE_ENUM, type MertricRecord } from "@shared/schema";

const ITEMS_PER_PAGE = 10;

export function LogHistory() {
	const user = useAuthStore((state) => state.user);
	const { toast } = useToast();
	const isPaidUser = user?.paymentType !== "free" && user?.paymentType;

	// Date filter state
	const today = new Date();
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(today.getDate() - 30);

	const [tempStartDate, setTempStartDate] = useState<string>(
		formatDate(thirtyDaysAgo, "yyyy-MM-dd"),
	);
	const [tempEndDate, setTempEndDate] = useState<string>(
		formatDate(today, "yyyy-MM-dd"),
	);
	const [startDate, setStartDate] = useState<string>(
		formatDate(thirtyDaysAgo, "yyyy-MM-dd"),
	);
	const [endDate, setEndDate] = useState<string>(
		formatDate(today, "yyyy-MM-dd"),
	);

	// Pagination state for each metric type
	const [bloodSugarPage, setBloodSugarPage] = useState(1);
	const [waterIntakePage, setWaterIntakePage] = useState(1);
	const [stepsPage, setStepsPage] = useState(1);
	const [heartBeatPage, setHeartBeatPage] = useState(1);

	// Calculate offsets for each metric type
	const bloodSugarOffset = (bloodSugarPage - 1) * ITEMS_PER_PAGE;
	const waterIntakeOffset = (waterIntakePage - 1) * ITEMS_PER_PAGE;
	const stepsOffset = (stepsPage - 1) * ITEMS_PER_PAGE;
	const heartBeatOffset = (heartBeatPage - 1) * ITEMS_PER_PAGE;

	// Fetch data for each metric type with their respective pagination
	const { data: bloodSugarData, isLoading: isLoadingBloodSugar } =
		useFilteredMetricsPaginated(
			startDate,
			endDate,
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE],
			ITEMS_PER_PAGE,
			bloodSugarOffset,
		);


	const { data: stepsData, isLoading: isLoadingSteps } =
		useFilteredMetricsPaginated(
			startDate,
			endDate,
			[METRIC_TYPE_ENUM.STEPS],
			ITEMS_PER_PAGE,
			stepsOffset,
		);

	const { data: heartBeatData, isLoading: isLoadingHeartBeat } =
		useFilteredMetricsPaginated(
			startDate,
			endDate,
			[METRIC_TYPE_ENUM.HEART_RATE],
			ITEMS_PER_PAGE,
			heartBeatOffset,
		);

	const handleFilter = () => {
		if (!tempStartDate || !tempEndDate) {
			toast({
				title: "Validation Error",
				description: "Please select both start and end dates",
				variant: "destructive",
			});
			return;
		}

		const start = new Date(tempStartDate);
		const end = new Date(tempEndDate);

		if (start > end) {
			toast({
				title: "Validation Error",
				description: "Start date must be before or equal to end date",
				variant: "destructive",
			});
			return;
		}

		// Reset all pagination to page 1
		setStartDate(tempStartDate);
		setEndDate(tempEndDate);
		setBloodSugarPage(1);
		setWaterIntakePage(1);
		setStepsPage(1);
		setHeartBeatPage(1);
	};

	const formatDateTime = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getTotalPages = (total: number): number => {
		return Math.ceil(total / ITEMS_PER_PAGE) || 1;
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main
				className="flex-1 flex justify-center"
				style={{ padding: "24px 16px" }}
			>
				<div className="w-full">
					{/* Header */}
					<div className="mb-8">
						<h1
							className="text-3xl font-bold mb-2"
							style={{ color: "#00453A" }}
						>
							Log History
						</h1>
						<p className="text-base" style={{ color: "#546E7A" }}>
							View and filter your log history
						</p>
					</div>

					{/* Date Filters */}
					<Card className="p-6 mb-8 bg-white">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
							<div>
								<Label htmlFor="startDate" className="mb-2 block">
									Start Date
								</Label>
								<Input
									id="startDate"
									type="date"
									value={tempStartDate}
									onChange={(e) => setTempStartDate(e.target.value)}
									max={endDate}
									style={{
										borderColor: "#E0E0E0",
										borderRadius: "8px",
									}}
								/>
							</div>
							<div>
								<Label htmlFor="endDate" className="mb-2 block">
									End Date
								</Label>
								<Input
									id="endDate"
									type="date"
									value={tempEndDate}
									onChange={(e) => setTempEndDate(e.target.value)}
									min={startDate}
									max={formatDate(today, "yyyy-MM-dd")}
									style={{
										borderColor: "#E0E0E0",
										borderRadius: "8px",
									}}
								/>
							</div>
							<div>
								<Button
									onClick={handleFilter}
									className="w-full"
									style={{
										background:
											"linear-gradient(135deg, #00856F 0%, #006B5C 100%)",
										color: "#FFFFFF",
										borderRadius: "8px",
									}}
								>
									Apply Filters
								</Button>
							</div>
						</div>
					</Card>

					{/* Blood Sugar Table */}
					<Card
						className="mb-6 transition-all duration-300 hover:shadow-lg"
						style={{
							background: "#FFFFFF",
							border: "1px solid rgba(0, 133, 111, 0.12)",
							borderRadius: "16px",
							boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
						}}
					>
						<div
							className="p-6 pb-4 border-b"
							style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
						>
							<h2
								className="text-xl font-semibold"
								style={{ color: "#00453A" }}
							>
								Blood Sugar (mg/dL)
							</h2>
						</div>
						<div className="p-6 pt-4">
							{isLoadingBloodSugar ? (
								<div className="flex justify-center items-center py-8">
									<Loader2
										className="h-6 w-6 animate-spin"
										style={{ color: "#00856F" }}
									/>
								</div>
							) : (
								<>
									<div
										className="overflow-x-auto rounded-lg"
										style={{ border: "1px solid rgba(0, 133, 111, 0.08)" }}
									>
										<Table>
											<TableHeader>
												<TableRow
													style={{
														background:
															"linear-gradient(135deg, rgba(0, 133, 111, 0.08) 0%, rgba(0, 107, 92, 0.08) 100%)",
													}}
												>
													<TableHead
														style={{
															color: "#00453A",
															fontWeight: 600,
															fontSize: "14px",
															textTransform: "uppercase",
															letterSpacing: "0.5px",
														}}
													>
														Date & Time
													</TableHead>
													<TableHead
														style={{
															color: "#00453A",
															fontWeight: 600,
															fontSize: "14px",
															textTransform: "uppercase",
															letterSpacing: "0.5px",
														}}
													>
														Value (mg/dL)
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{bloodSugarData?.bloodSugarRecords &&
													bloodSugarData.bloodSugarRecords.length > 0 ? (
													bloodSugarData.bloodSugarRecords.map(
														(record: MertricRecord, index: number) => {
															const recordedAtStr =
																typeof record.recordedAt === "string"
																	? record.recordedAt
																	: record.recordedAt instanceof Date
																		? record.recordedAt.toISOString()
																		: String(record.recordedAt);
															return (
																<TableRow
																	key={record.id}
																	className="transition-colors duration-150 hover:bg-teal-50/50"
																	style={{
																		borderBottom:
																			index <
																				(bloodSugarData.bloodSugarRecords
																					?.length || 0) -
																				1
																				? "1px solid rgba(0, 133, 111, 0.06)"
																				: "none",
																	}}
																>
																	<TableCell
																		style={{
																			color: "#546E7A",
																			fontSize: "14px",
																			padding: "16px 20px",
																		}}
																	>
																		{formatDateTime(recordedAtStr)}
																	</TableCell>
																	<TableCell
																		style={{
																			color: "#00453A",
																			fontSize: "15px",
																			fontWeight: 600,
																			padding: "16px 20px",
																		}}
																	>
																		{record.value}
																	</TableCell>
																</TableRow>
															);
														},
													)
												) : (
													<TableRow>
														<TableCell
															colSpan={2}
															className="text-center py-12 text-gray-500"
															style={{ fontSize: "14px" }}
														>
															No blood sugar records found for the selected date
															range
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
									{bloodSugarData?.bloodSugarRecords &&
										bloodSugarData?.bloodSugarRecords?.length > 0 && (
											<div className="mt-6">
												<ReusablePagination
													currentPage={bloodSugarPage}
													totalPages={getTotalPages(
														bloodSugarData.pagination.bloodSugar.total,
													)}
													onPageChange={setBloodSugarPage}
												/>
											</div>
										)}
								</>
							)}
						</div>
					</Card>

					{/* Water Intake Table */}


					{/* Steps Table */}
					<Card
						className="mb-6 transition-all duration-300 hover:shadow-lg"
						style={{
							background: "#FFFFFF",
							border: "1px solid rgba(0, 133, 111, 0.12)",
							borderRadius: "16px",
							boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
						}}
					>
						<div
							className="p-6 pb-4 border-b"
							style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
						>
							<h2
								className="text-xl font-semibold"
								style={{ color: "#00453A" }}
							>
								Steps
							</h2>
						</div>
						<div className="p-6 pt-4">
							{isLoadingSteps ? (
								<div className="flex justify-center items-center py-8">
									<Loader2
										className="h-6 w-6 animate-spin"
										style={{ color: "#00856F" }}
									/>
								</div>
							) : (
								<>
									<div
										className="overflow-x-auto rounded-lg"
										style={{ border: "1px solid rgba(0, 133, 111, 0.08)" }}
									>
										<Table>
											<TableHeader>
												<TableRow
													style={{
														background:
															"linear-gradient(135deg, rgba(0, 133, 111, 0.08) 0%, rgba(0, 107, 92, 0.08) 100%)",
													}}
												>
													<TableHead
														style={{
															color: "#00453A",
															fontWeight: 600,
															fontSize: "14px",
															textTransform: "uppercase",
															letterSpacing: "0.5px",
														}}
													>
														Date & Time
													</TableHead>
													<TableHead
														style={{
															color: "#00453A",
															fontWeight: 600,
															fontSize: "14px",
															textTransform: "uppercase",
															letterSpacing: "0.5px",
														}}
													>
														Value
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{stepsData?.stepsRecords &&
													stepsData.stepsRecords.length > 0 ? (
													stepsData.stepsRecords.map(
														(record: MertricRecord, index: number) => {
															const recordedAtStr =
																typeof record.recordedAt === "string"
																	? record.recordedAt
																	: record.recordedAt instanceof Date
																		? record.recordedAt.toISOString()
																		: String(record.recordedAt);
															return (
																<TableRow
																	key={record.id}
																	className="transition-colors duration-150 hover:bg-teal-50/50"
																	style={{
																		borderBottom:
																			index <
																				(stepsData.stepsRecords?.length || 0) - 1
																				? "1px solid rgba(0, 133, 111, 0.06)"
																				: "none",
																	}}
																>
																	<TableCell
																		style={{
																			color: "#546E7A",
																			fontSize: "14px",
																			padding: "16px 20px",
																		}}
																	>
																		{formatDateTime(recordedAtStr)}
																	</TableCell>
																	<TableCell
																		style={{
																			color: "#00453A",
																			fontSize: "15px",
																			fontWeight: 600,
																			padding: "16px 20px",
																		}}
																	>
																		{record.value}
																	</TableCell>
																</TableRow>
															);
														},
													)
												) : (
													<TableRow>
														<TableCell
															colSpan={2}
															className="text-center py-12 text-gray-500"
															style={{ fontSize: "14px" }}
														>
															No steps records found for the selected date range
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
									{stepsData?.stepsRecords &&
										stepsData?.stepsRecords?.length > 0 && (
											<div className="mt-6">
												<ReusablePagination
													currentPage={stepsPage}
													totalPages={getTotalPages(
														stepsData.pagination.steps.total,
													)}
													onPageChange={setStepsPage}
												/>
											</div>
										)}
								</>
							)}
						</div>
					</Card>

					{/* Heart Rate Table - Only for paid users */}
					{isPaidUser && (
						<Card
							className="mb-6 transition-all duration-300 hover:shadow-lg"
							style={{
								background: "#FFFFFF",
								border: "1px solid rgba(0, 133, 111, 0.12)",
								borderRadius: "16px",
								boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
							}}
						>
							<div
								className="p-6 pb-4 border-b"
								style={{ borderColor: "rgba(0, 133, 111, 0.1)" }}
							>
								<h2
									className="text-xl font-semibold"
									style={{ color: "#00453A" }}
								>
									Heart Rate (BPM)
								</h2>
							</div>
							<div className="p-6 pt-4">
								{isLoadingHeartBeat ? (
									<div className="flex justify-center items-center py-8">
										<Loader2
											className="h-6 w-6 animate-spin"
											style={{ color: "#00856F" }}
										/>
									</div>
								) : (
									<>
										<div
											className="overflow-x-auto rounded-lg "
											style={{ border: "1px solid rgba(0, 133, 111, 0.08)" }}
										>
											<Table className="">
												<TableHeader>
													<TableRow
														style={{
															background:
																"linear-gradient(135deg, rgba(0, 133, 111, 0.08) 0%, rgba(0, 107, 92, 0.08) 100%)",
														}}
													>
														<TableHead
															style={{
																color: "#00453A",
																fontWeight: 600,
																fontSize: "14px",
																textTransform: "uppercase",
																letterSpacing: "0.5px",
															}}
														>
															Date & Time
														</TableHead>
														<TableHead
															style={{
																color: "#00453A",
																fontWeight: 600,
																fontSize: "14px",
																textTransform: "uppercase",
																letterSpacing: "0.5px",
															}}
														>
															Value (BPM)
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{heartBeatData?.heartBeatRecords &&
														heartBeatData.heartBeatRecords.length > 0 ? (
														heartBeatData.heartBeatRecords.map(
															(record: MertricRecord, index: number) => (
																<TableRow
																	key={record.id}
																	className="transition-colors duration-150 hover:bg-teal-50/50"
																	style={{
																		borderBottom:
																			index <
																				heartBeatData.heartBeatRecords.length - 1
																				? "1px solid rgba(0, 133, 111, 0.06)"
																				: "none",
																	}}
																>
																	<TableCell
																		style={{
																			color: "#546E7A",
																			fontSize: "14px",
																			padding: "16px 20px",
																		}}
																	>
																		{formatDateTime(
																			typeof record.recordedAt === "string"
																				? record.recordedAt
																				: record.recordedAt.toISOString(),
																		)}
																	</TableCell>
																	<TableCell
																		style={{
																			color: "#00453A",
																			fontSize: "15px",
																			fontWeight: 600,
																			padding: "16px 20px",
																		}}
																	>
																		{record.value}
																	</TableCell>
																</TableRow>
															),
														)
													) : (
														<TableRow>
															<TableCell
																colSpan={2}
																className="text-center py-12 text-gray-500"
																style={{ fontSize: "14px" }}
															>
																No heart rate records found for the selected
																date range
															</TableCell>
														</TableRow>
													)}
												</TableBody>
											</Table>
										</div>
										{heartBeatData?.heartBeatRecords &&
											heartBeatData?.heartBeatRecords?.length > 0 && (
												<div className="mt-6">
													<ReusablePagination
														currentPage={heartBeatPage}
														totalPages={getTotalPages(
															heartBeatData.pagination.heartBeat.total,
														)}
														onPageChange={setHeartBeatPage}
													/>
												</div>
											)}
									</>
								)}
							</div>
						</Card>
					)}
				</div>
			</main>
		</div>
	);
}
