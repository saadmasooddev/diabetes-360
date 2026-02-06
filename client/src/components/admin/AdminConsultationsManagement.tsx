import { useState, useMemo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
	useAppointments,
	useUpdateConsultationStatus,
} from "@/hooks/mutations/useAppointments";
import { BOOKING_STATUS_ENUM } from "@shared/schema";
import { AccessControl } from "@/components/common/AccessControl";
import { PERMISSIONS } from "@/utils/permissions";
import { CalendarRange, ClipboardList, Loader2 } from "lucide-react";
import { DateManager } from "@/lib/utils";

const BOOKING_STATUS_OPTIONS = Object.values(BOOKING_STATUS_ENUM);

export function AdminConsultationsManagement() {
	const { toast } = useToast();
	const [page, setPage] = useState(1);
	const limit = 20;
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [search, setSearch] = useState("");
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const params = useMemo(() => {
		const p: {
			page: number;
			limit: number;
			search?: string;
			startDate?: string;
			endDate?: string;
		} = {
			page,
			limit,
		};
		if (search.trim()) p.search = search.trim();
		if (startDate)
			p.startDate = new Date(startDate).toISOString().split("T")[0];
		if (endDate) p.endDate = new Date(endDate).toISOString().split("T")[0];
		return p;
	}, [page, limit, search, startDate, endDate]);

	const { data, isLoading, isError } = useAppointments(params);
	const updateStatusMutation = useUpdateConsultationStatus();

	const appointments = data?.appointments ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	const handleStatusChange = async (bookingId: string, newStatus: string) => {
		setUpdatingId(bookingId);
		try {
			await updateStatusMutation.mutateAsync({
				bookingId,
				status: newStatus as
					| "pending"
					| "confirmed"
					| "cancelled"
					| "completed",
			});
			toast({
				title: "Status updated",
				description: "Consultation status has been updated successfully.",
			});
		} catch {
			toast({
				title: "Update failed",
				description: "Could not update consultation status. Please try again.",
				variant: "destructive",
			});
		} finally {
			setUpdatingId(null);
		}
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case BOOKING_STATUS_ENUM.CONFIRMED:
				return "default";
			case BOOKING_STATUS_ENUM.COMPLETED:
				return "secondary";
			case BOOKING_STATUS_ENUM.CANCELLED:
				return "destructive";
			default:
				return "outline";
		}
	};

	if (isLoading && appointments.length === 0) {
		return (
			<Card
				className="overflow-hidden"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
						<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
						Consultations
					</CardTitle>
					<CardDescription className="flex items-center gap-2 text-sm">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading consultations...
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card
				className="overflow-hidden"
				style={{
					background: "#FFFFFF",
					border: "1px solid rgba(0, 0, 0, 0.1)",
					borderRadius: "12px",
				}}
			>
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
						<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
						Consultations
					</CardTitle>
					<CardDescription className="text-sm">
						View and manage user consultations. Filter by date range and change
						status as needed.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 sm:p-6 pt-0 space-y-4">
					{/* Filters */}
					<div className="flex flex-col sm:flex-row gap-4 flex-wrap">
						<div className="flex items-end gap-2">
							<div className="space-y-1">
								<Label className="text-xs text-gray-600">Start date</Label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => {
										setStartDate(e.target.value);
										setPage(1);
									}}
									className="w-[140px]"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-gray-600">End date</Label>
								<Input
									type="date"
									value={endDate}
									onChange={(e) => {
										setEndDate(e.target.value);
										setPage(1);
									}}
									className="w-[140px]"
								/>
							</div>
							<Button
								variant="outline"
								size="icon"
								title="Clear dates"
								onClick={() => {
									setStartDate("");
									setEndDate("");
									setPage(1);
								}}
							>
								<CalendarRange className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex-1 min-w-[180px]">
							<Label className="text-xs text-gray-600">
								Search (patient / doctor)
							</Label>
							<Input
								placeholder="Search by name..."
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="mt-0"
							/>
						</div>
					</div>

					{isError && (
						<p className="text-sm text-destructive">
							Failed to load consultations. Please try again.
						</p>
					)}

					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Time</TableHead>
									<TableHead>Patient</TableHead>
									<TableHead>Doctor</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<AccessControl permission={PERMISSIONS.UPDATE_ALL_BOOKINGS}>
										<TableHead className="w-[180px]">Change status</TableHead>
									</AccessControl>
								</TableRow>
							</TableHeader>
							<TableBody>
								{appointments.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center text-muted-foreground py-8"
										>
											No consultations found. Adjust filters or date range.
										</TableCell>
									</TableRow>
								) : (
									appointments.map((apt) => (
										<TableRow key={apt.id}>
											<TableCell className="font-medium">
												{DateManager.formatDisplayDate(apt.date)}
											</TableCell>
											<TableCell>{apt.time}</TableCell>
											<TableCell>{apt.patientName}</TableCell>
											<TableCell>{apt.doctorName}</TableCell>
											<TableCell>{apt.type}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
														getStatusBadgeVariant(apt.status) === "destructive"
															? "bg-red-100 text-red-800"
															: getStatusBadgeVariant(apt.status) === "default"
																? "bg-teal-100 text-teal-800"
																: getStatusBadgeVariant(apt.status) ===
																		"secondary"
																	? "bg-gray-100 text-gray-800"
																	: "bg-amber-50 text-amber-800 border border-amber-200"
													}`}
												>
													{apt.status}
												</span>
											</TableCell>
											<AccessControl
												permission={PERMISSIONS.UPDATE_ALL_BOOKINGS}
											>
												<TableCell>
													<Select
														value={apt.status}
														onValueChange={(value) =>
															handleStatusChange(apt.id, value)
														}
														disabled={
															updatingId === apt.id ||
															updateStatusMutation.isPending
														}
													>
														<SelectTrigger className="w-[160px] h-8">
															{updatingId === apt.id ? (
																<Loader2 className="h-4 w-4 animate-spin mr-2" />
															) : null}
															<SelectValue placeholder="Status" />
														</SelectTrigger>
														<SelectContent>
															{BOOKING_STATUS_OPTIONS.map((s) => (
																<SelectItem
																	key={s}
																	value={s}
																	className="capitalize"
																>
																	{s}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
											</AccessControl>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
								of {total}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
