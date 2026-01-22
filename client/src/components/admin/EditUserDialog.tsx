import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { useUpdateUser, useUser } from "@/hooks/mutations/useAdmin";
import {
	useSpecialtiesAdmin,
	usePhysicianData,
	useUploadPhysicianImage,
} from "@/hooks/mutations/usePhysician";
import type { User } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
	genderOptions,
	diabetesTypeOptions,
	dayOptions,
	monthOptions,
	yearOptions,
	weightOptions,
	heightOptions,
} from "@/mocks/profileData";
import { AdminPhysicianSlotManagement } from "./AdminPhysicianSlotManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseDateToComponents, handleNumberInput } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const updateUserSchema = z.object({
	firstName: z.string().min(1, "First name is required").optional(),
	lastName: z.string().min(1, "Last name is required").optional(),
	email: z.email("Invalid email address"),
	password: z.string().optional(),
	role: z.enum(["customer", "admin", "physician"]),
	isActive: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface EditUserDialogProps {
	user: User;
	onClose: () => void;
}

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("profile");
	const { toast } = useToast();
	const [physicianFields, setPhysicianFields] = useState({
		specialtyId: "",
		practiceStartDate: "",
		consultationFee: "",
		imageFile: null as File | null,
		imagePreview: "",
		imageUrl: "",
	});
	const [customerFields, setCustomerFields] = useState({
		gender: "male" as "male" | "female",
		birthDay: "",
		birthMonth: "",
		birthYear: "",
		diagnosisDay: "",
		diagnosisMonth: "",
		diagnosisYear: "",
		weight: "",
		height: "",
		diabetesType: "" as "type1" | "type2" | "gestational" | "prediabetes" | "",
	});
	const updateUserMutation = useUpdateUser();
	const { data: specialties = [] } = useSpecialtiesAdmin();
	const uploadImageMutation = useUploadPhysicianImage();

	// Fetch physician data if user is a physician
	const { data: physicianData } = usePhysicianData(
		user.role === "physician" ? user.id : null,
	);

	// Fetch full user data with customer data if user is a customer
	const { data: fullUserData } = useUser(
		user.role === "customer" ? user.id : "",
	);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<UpdateUserForm>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			firstName: (user as any).firstName || "",
			lastName: (user as any).lastName || "",
			email: user.email,
			role: user.role,
			isActive: user.isActive,
		},
	});

	const watchedRole = watch("role");
	const watchedIsActive = watch("isActive");

	// Load physician data when available
	useEffect(() => {
		if (physicianData && user.role === "physician") {
			const startDate = new Date(physicianData.practiceStartDate);
			const formattedDate = startDate.toISOString().split("T")[0];
			setPhysicianFields({
				specialtyId: physicianData.specialtyId,
				practiceStartDate: formattedDate,
				consultationFee: physicianData.consultationFee,
				imageFile: null,
				imagePreview: "",
				imageUrl: physicianData.imageUrl || "",
			});
		}
	}, [physicianData, user.role]);

	// Load customer data from fetched user data
	useEffect(() => {
		if (user.role === "customer") {
			const customerData =
				fullUserData?.user?.customerData ||
				(user as any).customerData ||
				fullUserData?.customerData;
			if (customerData) {
				// Transform combined date fields to separate components
				const birthdayComponents = parseDateToComponents(
					customerData.birthday || "",
				);
				const diagnosisComponents = parseDateToComponents(
					customerData.diagnosisDate || "",
				);

				setCustomerFields({
					gender: customerData.gender || "male",
					birthDay: birthdayComponents.day,
					birthMonth: birthdayComponents.month,
					birthYear: birthdayComponents.year,
					diagnosisDay: diagnosisComponents.day,
					diagnosisMonth: diagnosisComponents.month,
					diagnosisYear: diagnosisComponents.year,
					weight: customerData.weight || "",
					height: customerData.height || "",
					diabetesType:
						(customerData.diabetesType as
							| "type1"
							| "type2"
							| "gestational"
							| "prediabetes") || "",
				});
			}
		}
	}, [user.role, fullUserData, user]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPhysicianFields({ ...physicianFields, imageFile: file });
			const reader = new FileReader();
			reader.onloadend = () => {
				setPhysicianFields({
					...physicianFields,
					imageFile: file,
					imagePreview: reader.result as string,
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const getMaxDate = () => {
		const today = new Date();
		return today.toISOString().split("T")[0];
	};

	const onSubmit = async (data: UpdateUserForm) => {
		setIsLoading(true);
		try {
			// Remove password from data if it's empty
			const updateData: any = { ...data };
			if (!updateData.password) {
				delete updateData.password;
			}
			// Ensure firstName and lastName are included
			if (!updateData.firstName) {
				updateData.firstName = (user as any).firstName || "";
			}
			if (!updateData.lastName) {
				updateData.lastName = (user as any).lastName || "";
			}

			if (data.role === "physician" || user.role === "physician") {
				let imageUrl = physicianFields.imageUrl;

				// Upload new image if provided
				if (physicianFields.imageFile) {
					imageUrl = await uploadImageMutation.mutateAsync(
						physicianFields.imageFile,
					);
				}

				// Validate practice start date is not in the future
				if (physicianFields.practiceStartDate) {
					const practiceDate = new Date(physicianFields.practiceStartDate);
					const today = new Date();
					today.setHours(0, 0, 0, 0);

					if (practiceDate > today) {
						throw new Error("Practice start date cannot be in the future");
					}
				}

				updateData.physicianData = {
					specialtyId:
						physicianFields.specialtyId ||
						(user.role === "physician" && physicianData?.specialtyId) ||
						"",
					practiceStartDate: physicianFields.practiceStartDate
						? new Date(physicianFields.practiceStartDate).toISOString()
						: user.role === "physician" && physicianData?.practiceStartDate
							? new Date(physicianData.practiceStartDate).toISOString()
							: new Date().toISOString(),
					consultationFee:
						physicianFields.consultationFee ||
						(user.role === "physician" && physicianData?.consultationFee) ||
						"0",
					imageUrl: imageUrl || null,
				};
			}

			// If customer role, include customer data
			if (data.role === "customer" || user.role === "customer") {
				if (customerFields.diabetesType) {
					const customerData: any = {
						gender: customerFields.gender,
						weight: customerFields.weight,
						height: customerFields.height,
						diabetesType: customerFields.diabetesType,
					};

					// Transform separate date fields to combined format
					if (
						customerFields.birthDay &&
						customerFields.birthMonth &&
						customerFields.birthYear
					) {
						const paddedMonth = String(customerFields.birthMonth).padStart(
							2,
							"0",
						);
						const paddedDay = String(customerFields.birthDay).padStart(2, "0");
						customerData.birthday = `${customerFields.birthYear}-${paddedMonth}-${paddedDay}`;
					}

					if (
						customerFields.diagnosisDay &&
						customerFields.diagnosisMonth &&
						customerFields.diagnosisYear
					) {
						const paddedMonth = String(customerFields.diagnosisMonth).padStart(
							2,
							"0",
						);
						const paddedDay = String(customerFields.diagnosisDay).padStart(
							2,
							"0",
						);
						customerData.diagnosisDate = `${customerFields.diagnosisYear}-${paddedMonth}-${paddedDay}`;
					}

					updateData.customerData = customerData;
				}
			}

			await updateUserMutation.mutateAsync({ id: user.id, data: updateData });
			onClose();
		} catch (error: any) {
			// Error is handled by the mutation hook or show validation error
			toast({
				title: "Update Failed",
				description: error.message || "Failed to update user.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[600px] max-h-[90vh] flex flex-col">
				<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
					<DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
					<DialogDescription className="text-xs sm:text-sm">
						Update user information and permissions.
					</DialogDescription>
				</DialogHeader>
				<div className="flex-1 overflow-y-auto px-4 sm:px-6">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="space-y-4"
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="profile">Profile</TabsTrigger>
							{(watchedRole === "physician" || user.role === "physician") && (
								<TabsTrigger value="availability">Availability</TabsTrigger>
							)}
						</TabsList>

						<TabsContent value="profile">
							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-4"
								id="edit-user-form"
							>
								<div className="space-y-2">
									<Label htmlFor="firstName">First Name</Label>
									<Input
										id="firstName"
										type="text"
										{...register("firstName")}
										placeholder="Enter first name"
										disabled={isLoading}
									/>
									{errors.firstName && (
										<p className="text-sm text-red-600">
											{errors.firstName.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										type="text"
										{...register("lastName")}
										placeholder="Enter last name"
										disabled={isLoading}
									/>
									{errors.lastName && (
										<p className="text-sm text-red-600">
											{errors.lastName.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										{...register("email")}
										placeholder="Enter email address"
										disabled={isLoading}
									/>
									{errors.email && (
										<p className="text-sm text-red-600">
											{errors.email.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">New Password (optional)</Label>
									<Input
										id="password"
										type="password"
										{...register("password")}
										placeholder="Leave blank to keep current password"
										disabled={isLoading}
									/>
									{errors.password && (
										<p className="text-sm text-red-600">
											{errors.password.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="role">Role</Label>
									<Select
										value={watchedRole}
										onValueChange={(value) => setValue("role", value as any)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="customer">Customer</SelectItem>
											<SelectItem value="physician">Physician</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
									{errors.role && (
										<p className="text-sm text-red-600">
											{errors.role.message}
										</p>
									)}
								</div>

								<div className="flex items-center space-x-2">
									<Switch
										id="isActive"
										checked={watchedIsActive}
										onCheckedChange={(checked) => setValue("isActive", checked)}
										disabled={isLoading}
									/>
									<Label htmlFor="isActive">Active Account</Label>
								</div>

								{(watchedRole === "physician" || user.role === "physician") && (
									<div className="space-y-4 pt-4 border-t">
										<h3 className="font-semibold text-gray-900">
											Physician Information
										</h3>

										<div className="space-y-2">
											<Label htmlFor="specialtyId">Specialty *</Label>
											<Select
												value={physicianFields.specialtyId}
												onValueChange={(value) =>
													setPhysicianFields({
														...physicianFields,
														specialtyId: value,
													})
												}
												disabled={isLoading}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select specialty" />
												</SelectTrigger>
												<SelectContent>
													{specialties.map((specialty) => (
														<SelectItem key={specialty.id} value={specialty.id}>
															{specialty.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{!physicianFields.specialtyId &&
												(watchedRole === "physician" ||
													user.role === "physician") && (
													<p className="text-sm text-red-600">
														Specialty is required
													</p>
												)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="practiceStartDate">
												Practice Start Date *
											</Label>
											<Input
												id="practiceStartDate"
												type="date"
												value={physicianFields.practiceStartDate}
												onChange={(e) => {
													const selectedDate = e.target.value;
													const today = new Date();
													today.setHours(0, 0, 0, 0);
													const dateObj = new Date(selectedDate);

													if (dateObj > today) {
														alert(
															"Practice start date cannot be in the future",
														);
														return;
													}
													setPhysicianFields({
														...physicianFields,
														practiceStartDate: selectedDate,
													});
												}}
												max={getMaxDate()}
												required={
													watchedRole === "physician" ||
													user.role === "physician"
												}
												disabled={isLoading}
											/>
											{!physicianFields.practiceStartDate &&
												(watchedRole === "physician" ||
													user.role === "physician") && (
													<p className="text-sm text-red-600">
														Practice start date is required
													</p>
												)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="consultationFee">
												Consultation Fee (PKR) *
											</Label>
											<Input
												id="consultationFee"
												type="text"
												inputMode="decimal"
												min="0"
												step="0.01"
												value={physicianFields.consultationFee}
												onChange={(e) => {
													const sanitized = handleNumberInput(
														physicianFields.consultationFee,
														e.target.value,
													);
													setPhysicianFields({
														...physicianFields,
														consultationFee: sanitized,
													});
												}}
												placeholder="0.00"
												required={
													watchedRole === "physician" ||
													user.role === "physician"
												}
												disabled={isLoading}
											/>
											{!physicianFields.consultationFee &&
												(watchedRole === "physician" ||
													user.role === "physician") && (
													<p className="text-sm text-red-600">
														Consultation fee is required
													</p>
												)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="physicianImage">Profile Image</Label>
											<Input
												id="physicianImage"
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												disabled={isLoading}
											/>
											{(physicianFields.imagePreview ||
												physicianFields.imageUrl) && (
													<Image
														src={
															physicianFields.imagePreview ||
															physicianFields.imageUrl
														}
														alt="Preview"
														className="w-24 h-24 rounded-full object-cover border"
														pointToServer={
															!!physicianFields.imageUrl &&
															!physicianFields.imagePreview
														}
													/>
												)}
										</div>
									</div>
								)}

								{(watchedRole === "customer" || user.role === "customer") && (
									<div className="space-y-4 pt-4 border-t">
										<h3 className="font-semibold text-gray-900">
											Customer Information
										</h3>

										<div className="space-y-2">
											<Label htmlFor="customerGender">Gender</Label>
											<Select
												value={customerFields.gender}
												onValueChange={(value) =>
													setCustomerFields({
														...customerFields,
														gender: value as "male" | "female",
													})
												}
												disabled={isLoading}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{genderOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="customerBirthDate">Date of Birth</Label>
											<div className="grid grid-cols-3 gap-2">
												<Select
													value={customerFields.birthDay}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															birthDay: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="DD" />
													</SelectTrigger>
													<SelectContent>
														{dayOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={customerFields.birthMonth}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															birthMonth: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="MM" />
													</SelectTrigger>
													<SelectContent>
														{monthOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={customerFields.birthYear}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															birthYear: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="YYYY" />
													</SelectTrigger>
													<SelectContent>
														{yearOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="customerDiagnosisDate">
												Diagnosis Date
											</Label>
											<div className="grid grid-cols-3 gap-2">
												<Select
													value={customerFields.diagnosisDay}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															diagnosisDay: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="DD" />
													</SelectTrigger>
													<SelectContent>
														{dayOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={customerFields.diagnosisMonth}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															diagnosisMonth: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="MM" />
													</SelectTrigger>
													<SelectContent>
														{monthOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Select
													value={customerFields.diagnosisYear}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															diagnosisYear: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="YYYY" />
													</SelectTrigger>
													<SelectContent>
														{yearOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="customerWeight">Weight (kg)</Label>
												<Select
													value={customerFields.weight}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															weight: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select weight" />
													</SelectTrigger>
													<SelectContent>
														{weightOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="customerHeight">Height (cm)</Label>
												<Select
													value={customerFields.height}
													onValueChange={(value) =>
														setCustomerFields({
															...customerFields,
															height: value,
														})
													}
													disabled={isLoading}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select height" />
													</SelectTrigger>
													<SelectContent>
														{heightOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="customerDiabetesType">
												Diabetes Type *
											</Label>
											<Select
												value={customerFields.diabetesType}
												onValueChange={(value) =>
													setCustomerFields({
														...customerFields,
														diabetesType: value as any,
													})
												}
												disabled={isLoading}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select diabetes type" />
												</SelectTrigger>
												<SelectContent>
													{diabetesTypeOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{!customerFields.diabetesType && (
												<p className="text-sm text-red-600">
													Diabetes type is required for customer accounts
												</p>
											)}
										</div>
									</div>
								)}
							</form>
						</TabsContent>

						{(watchedRole === "physician" || user.role === "physician") && (
							<TabsContent value="availability">
								<AdminPhysicianSlotManagement physicianId={user.id} />
							</TabsContent>
						)}
					</Tabs>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					{activeTab === "profile" && (
						<Button
							type="submit"
							form="edit-user-form"
							disabled={isLoading}
							className="bg-teal-600 hover:bg-teal-700"
						>
							{isLoading ? (
								<>
									<ButtonSpinner className="mr-2" />
									Updating...
								</>
							) : (
								"Update User"
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
