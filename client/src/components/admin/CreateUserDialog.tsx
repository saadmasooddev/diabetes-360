import { useState } from "react";
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
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PhysicianAvatar } from "@/components/physician/PhysicianAvatar";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateUser } from "@/hooks/mutations/useAdmin";
import { useSpecialtiesAdmin } from "@/hooks/mutations/usePhysician";
import { useToast } from "@/hooks/use-toast";
import { physicianService } from "@/services/physicianService";
import {
	genderOptions,
	diabetesTypeOptions,
	dayOptions,
	monthOptions,
	yearOptions,
	weightOptions,
	heightOptions,
} from "@/mocks/profileData";
import { handleNumberInput } from "@/lib/utils";
import { signupSchema } from "@/schemas/auth.schema";
import { USER_ROLES } from "@shared/schema";

const createUserSchema = signupSchema
	.omit({ confirmPassword: true, agreeToTerms: true })
	.extend({
		role: z.enum(Object.values(USER_ROLES)),
		isActive: z.boolean(),
	});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
	onClose: () => void;
}

export function CreateUserDialog({ onClose }: CreateUserDialogProps) {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [physicianFields, setPhysicianFields] = useState({
		specialtyId: "",
		practiceStartDate: "",
		consultationFee: "",
		imageFile: null as File | null,
		imagePreview: "",
	});
	const [customerFields, setCustomerFields] = useState({
		gender: "male" as "male" | "female",
		birthDay: "",
		birthMonth: "",
		birthYear: "",
		weight: "",
		height: "",
		diabetesType: "" as "type1" | "type2" | "gestational" | "prediabetes" | "",
	});
	const createUserMutation = useCreateUser();
	const { data: specialties = [], isLoading: isLoadingSpecialties } =
		useSpecialtiesAdmin();
	const [isProfileImageUploading, setIsProfileImageUploading] = useState(false);
	const isLoading =
		createUserMutation.isPending ||
		isLoadingSpecialties ||
		isProfileImageUploading;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<CreateUserForm>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			role: "customer",
			isActive: true,
		},
	});

	const watchedRole = watch("role");
	const watchedIsActive = watch("isActive");
	const watchedFirstName = watch("firstName");
	const watchedLastName = watch("lastName");

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

	const onSubmit = async (data: CreateUserForm) => {
		try {
			const userData: any = { ...data };

			// If physician role, include physician data (image uploaded to Azure after user exists)
			if (data.role === "physician") {
				// Validate practice start date is not in the future
				if (physicianFields.practiceStartDate) {
					const practiceDate = new Date(physicianFields.practiceStartDate);
					const today = new Date();
					today.setHours(0, 0, 0, 0);

					if (practiceDate > today) {
						throw new Error("Practice start date cannot be in the future");
					}
				}

				userData.physicianData = {
					specialtyId:
						physicianFields.specialtyId ||
						specialties.find((s) => s.name === "General")?.id ||
						"",
					practiceStartDate: physicianFields.practiceStartDate
						? new Date(physicianFields.practiceStartDate).toISOString()
						: new Date().toISOString(),
					consultationFee: physicianFields.consultationFee || "0",
					imageUrl: null,
				};
			}

			// If customer role, include customer data (at least diabetes type)
			if (data.role === "customer" && customerFields.diabetesType) {
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


				userData.customerData = customerData;
			}

			const createdUser = await createUserMutation.mutateAsync(userData);

			if (
				data.role === "physician" &&
				physicianFields.imageFile &&
				createdUser?.id
			) {
				setIsProfileImageUploading(true);
				try {
					await physicianService.uploadPhysicianProfileImage(
						createdUser.id,
						physicianFields.imageFile,
					);
					await queryClient.invalidateQueries({
						queryKey: ["physician", "admin", "physician-data", createdUser.id],
					});
					await queryClient.invalidateQueries({ queryKey: ["physician"] });
				} finally {
					setIsProfileImageUploading(false);
				}
			}

			// Reset form state after successful creation
			reset({
				firstName: "",
				lastName: "",
				email: "",
				password: "",
				role: "customer",
				isActive: true,
			});
			setPhysicianFields({
				specialtyId: "",
				practiceStartDate: "",
				consultationFee: "",
				imageFile: null,
				imagePreview: "",
			});
			setCustomerFields({
				gender: "male",
				birthDay: "",
				birthMonth: "",
				birthYear: "",
				weight: "",
				height: "",
				diabetesType: "",
			});

			onClose();
		} catch (error: any) {
			toast({
				title: "Creation Failed",
				description: error.message || "Failed to create user.",
				variant: "destructive",
			});
		}
	};

	return (
		<DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[425px] max-h-[90vh] flex flex-col">
			<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
				<DialogTitle className="text-lg sm:text-xl">
					Create New User
				</DialogTitle>
				<DialogDescription className="text-xs sm:text-sm">
					Create a new user account with the specified role and permissions.
				</DialogDescription>
			</DialogHeader>
			<div className="flex-1 overflow-y-auto px-4 sm:px-6">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4"
					id="create-user-form"
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
							<p className="text-sm text-red-600">{errors.firstName.message}</p>
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
							<p className="text-sm text-red-600">{errors.lastName.message}</p>
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
							<p className="text-sm text-red-600">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							{...register("password")}
							placeholder="Enter password"
							disabled={isLoading}
						/>
						{errors.password && (
							<p className="text-sm text-red-600">{errors.password.message}</p>
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
							<p className="text-sm text-red-600">{errors.role.message}</p>
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

					{watchedRole === "physician" && (
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
									disabled={isLoadingSpecialties || isLoading}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												isLoadingSpecialties
													? "Loading specialties..."
													: "Select specialty"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{specialties.map((specialty) => (
											<SelectItem key={specialty.id} value={specialty.id}>
												{specialty.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="practiceStartDate">Practice Start Date *</Label>
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
											toast({
												title: "Validation Failed",
												description:
													"Practice start date cannot be in the future",
												variant: "destructive",
											});
											return;
										}
										setPhysicianFields({
											...physicianFields,
											practiceStartDate: selectedDate,
										});
									}}
									max={new Date().toISOString().split("T")[0]}
									required={watchedRole === "physician"}
								/>
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
									required={watchedRole === "physician"}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="physicianImage">Profile Image</Label>
								<Input
									id="physicianImage"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
								/>
								<PhysicianAvatar
									firstName={watchedFirstName}
									lastName={watchedLastName}
									imageUrl={physicianFields.imagePreview || undefined}
									className="h-24 w-24"
									imgClassName="border"
								/>
							</div>
						</div>
					)}

					{watchedRole === "customer" && (
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
											setCustomerFields({ ...customerFields, birthDay: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="DD" />
										</SelectTrigger>
										<SelectContent>
											{dayOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
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
									>
										<SelectTrigger>
											<SelectValue placeholder="MM" />
										</SelectTrigger>
										<SelectContent>
											{monthOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={customerFields.birthYear}
										onValueChange={(value) =>
											setCustomerFields({ ...customerFields, birthYear: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="YYYY" />
										</SelectTrigger>
										<SelectContent>
											{yearOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
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
											setCustomerFields({ ...customerFields, weight: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select weight" />
										</SelectTrigger>
										<SelectContent>
											{weightOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
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
											setCustomerFields({ ...customerFields, height: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select height" />
										</SelectTrigger>
										<SelectContent>
											{heightOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="customerDiabetesType">Diabetes Type *</Label>
								<Select
									value={customerFields.diabetesType}
									onValueChange={(value) =>
										setCustomerFields({
											...customerFields,
											diabetesType: value as any,
										})
									}
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
				<Button
					type="submit"
					form="create-user-form"
					disabled={isLoading}
					className="bg-teal-600 hover:bg-teal-700"
				>
					{isLoading ? (
						<>
							<ButtonSpinner className="mr-2 h-4 w-4" />
							Creating...
						</>
					) : (
						"Create User"
					)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
