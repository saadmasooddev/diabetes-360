import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Edit, Trash2, Stethoscope } from "lucide-react";
import {
	useSpecialtiesAdmin,
	useCreateSpecialty,
	useUpdateSpecialty,
	useDeleteSpecialty,
} from "@/hooks/mutations/usePhysician";
import type { PhysicianSpecialty } from "@/services/physicianService";

export function PhysicianSettings() {
	const { data: specialties = [], isLoading } = useSpecialtiesAdmin();
	const createMutation = useCreateSpecialty();
	const updateMutation = useUpdateSpecialty();
	const deleteMutation = useDeleteSpecialty();

	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingSpecialty, setEditingSpecialty] =
		useState<PhysicianSpecialty | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		icon: "stethoscope",
		isActive: true,
	});

	const handleCreate = async () => {
		createMutation.mutate(formData, {
			onSuccess: () => {
				setIsCreateDialogOpen(false);
				setFormData({
					name: "",
					description: "",
					icon: "stethoscope",
					isActive: true,
				});
			},
		});
	};

	const handleEdit = (specialty: PhysicianSpecialty) => {
		setEditingSpecialty(specialty);
		setFormData({
			name: specialty.name,
			description: specialty.description || "",
			icon: specialty.icon || "stethoscope",
			isActive: specialty.isActive,
		});
	};

	const handleUpdate = async () => {
		if (editingSpecialty) {
			updateMutation.mutate(
				{
					id: editingSpecialty.id,
					data: formData,
				},
				{
					onSuccess: () => {
						setEditingSpecialty(null);
						setFormData({
							name: "",
							description: "",
							icon: "stethoscope",
							isActive: true,
						});
					},
				},
			);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this specialty?")) {
			deleteMutation.mutate(id);
		}
	};

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
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
							<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
							Physician Specialties
						</CardTitle>
						<CardDescription className="text-sm">
							Manage physician specialties available for consultation
						</CardDescription>
					</div>
					<Button
						onClick={() => setIsCreateDialogOpen(true)}
						className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
					>
						<Plus className="h-4 w-4 mr-2" />
						Add Specialty
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-4 sm:p-6 pt-0">
				{isLoading ? (
					<div className="text-center py-8">
						<p className="text-gray-600">Loading specialties...</p>
					</div>
				) : (
					<>
						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>Icon</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="w-[50px]"></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{specialties.map((specialty) => (
											<TableRow key={specialty.id}>
												<TableCell className="font-medium">
													{specialty.name}
												</TableCell>
												<TableCell>{specialty.description || "-"}</TableCell>
												<TableCell>{specialty.icon || "-"}</TableCell>
												<TableCell>
													<Badge
														variant={
															specialty.isActive ? "default" : "secondary"
														}
													>
														{specialty.isActive ? "Active" : "Inactive"}
													</Badge>
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" className="h-8 w-8 p-0">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => handleEdit(specialty)}
															>
																<Edit className="h-4 w-4 mr-2" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDelete(specialty.id)}
																className="text-destructive"
															>
																<Trash2 className="h-4 w-4 mr-2" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden space-y-4">
							{specialties.map((specialty) => (
								<div
									key={specialty.id}
									className="border rounded-lg p-4 space-y-3"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="font-medium text-gray-900">
												{specialty.name}
											</h3>
											{specialty.description && (
												<p className="text-sm text-gray-600 mt-1">
													{specialty.description}
												</p>
											)}
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" className="h-8 w-8 p-0">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleEdit(specialty)}>
													<Edit className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(specialty.id)}
													className="text-destructive"
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
									<div className="flex flex-wrap gap-2">
										<Badge
											variant={specialty.isActive ? "default" : "secondary"}
										>
											{specialty.isActive ? "Active" : "Inactive"}
										</Badge>
										{specialty.icon && (
											<Badge variant="outline">Icon: {specialty.icon}</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					</>
				)}

				{specialties.length === 0 && !isLoading && (
					<div className="text-center py-8 text-muted-foreground">
						No specialties found.
					</div>
				)}
			</CardContent>

			{/* Create Dialog */}
			<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
				<DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[425px] max-h-[90vh] flex flex-col">
					<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
						<DialogTitle className="text-lg sm:text-xl">
							Create Specialty
						</DialogTitle>
						<DialogDescription className="text-xs sm:text-sm">
							Add a new physician specialty
						</DialogDescription>
					</DialogHeader>
					<div className="flex-1 overflow-y-auto px-4 sm:px-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="e.g., Diabetologist"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Specialty description"
								/>
							</div>
							{/* <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., stethoscope"
              />
            </div> */}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!formData.name || createMutation.isPending}
							className="bg-teal-600 hover:bg-teal-700"
						>
							{createMutation.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={!!editingSpecialty}
				onOpenChange={() => setEditingSpecialty(null)}
			>
				<DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[425px] max-h-[90vh] flex flex-col">
					<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
						<DialogTitle className="text-lg sm:text-xl">
							Edit Specialty
						</DialogTitle>
						<DialogDescription className="text-xs sm:text-sm">
							Update specialty information
						</DialogDescription>
					</DialogHeader>
					<div className="flex-1 overflow-y-auto px-4 sm:px-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Name *</Label>
								<Input
									id="edit-name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="e.g., Diabetologist"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-description">Description</Label>
								<Input
									id="edit-description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Specialty description"
								/>
							</div>
							{/* <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., stethoscope"
              />
            </div> */}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingSpecialty(null)}>
							Cancel
						</Button>
						<Button
							onClick={handleUpdate}
							disabled={!formData.name || updateMutation.isPending}
							className="bg-teal-600 hover:bg-teal-700"
						>
							{updateMutation.isPending ? "Updating..." : "Update"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
