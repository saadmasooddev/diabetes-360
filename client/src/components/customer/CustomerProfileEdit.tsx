import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	genderOptions,
	diabetesTypeOptions,
	dayOptions,
	monthOptions,
	yearOptions,
	weightOptions,
	heightOptions,
} from "@/mocks/profileData";
import { useUpdateCustomerData } from "@/hooks/mutations/useCustomer";
import type { CustomerData } from "@/services/customerService";
import { parseDateToComponents } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
	DIABETES_TYPE,
	ProfileDataFormValues,
	profileDataSchema,
} from "@shared/schema";

interface CustomerProfileEditProps {
	customerData: CustomerData;
	onClose: () => void;
	onSuccess: () => void;
}

export function CustomerProfileEdit({
	customerData,
	onClose,
	onSuccess,
}: CustomerProfileEditProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const updateCustomerData = useUpdateCustomerData();
	const { user: authUser, setUser } = useAuthStore();

	const {
		day: birthDay,
		month: birthMonth,
		year: birthYear,
	} = parseDateToComponents(customerData.birthday);

	const form = useForm<ProfileDataFormValues>({
		resolver: zodResolver(profileDataSchema),
		defaultValues: {
			firstName: customerData.firstName,
			lastName: customerData.lastName,
			gender: customerData.gender as "male" | "female",
			birthDay,
			birthMonth,
			birthYear,
			weight: customerData.weight,
			height: customerData.height,
			diabetesType: customerData.diabetesType as DIABETES_TYPE,
			mainGoal: customerData.mainGoal || "",
			onDiabetesMedicationOrInsulin: customerData.medicationInfo || "",
		},
	});

	const onSubmit = async (data: ProfileDataFormValues) => {
		setIsSubmitting(true);
		try {
			await updateCustomerData.mutateAsync(data);
			if (authUser) {
				setUser({
					...authUser,
					firstName: data.firstName || "",
					lastName: data.lastName || "",
				});
			}
			// Reset form to updated values
			const {
				day: birthDay,
				month: birthMonth,
				year: birthYear,
			} = parseDateToComponents(customerData.birthday);

			form.reset({
				firstName: data.firstName,
				lastName: data.lastName,
				gender: data.gender,
				birthDay,
				birthMonth,
				birthYear,
				weight: data.weight,
				height: data.height,
				diabetesType: data.diabetesType,
			});
			onSuccess();
		} catch (error) {
			// Error handling is done in the mutation hook
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4 sm:space-y-6"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Last Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="gender"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Gender</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select gender" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{genderOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div>
					<Label className="text-sm">Date of Birth</Label>
					<div className="grid grid-cols-3 gap-2 mt-2">
						<FormField
							control={form.control}
							name="birthDay"
							render={({ field }) => (
								<FormItem>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="DD" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{dayOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="birthMonth"
							render={({ field }) => (
								<FormItem>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="MM" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{monthOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="birthYear"
							render={({ field }) => (
								<FormItem>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="YYYY" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{yearOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="weight"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Weight (kg)</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select weight" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{weightOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="height"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Height (cm)</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select height" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{heightOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="diabetesType"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Diabetes Type</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select diabetes type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{diabetesTypeOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="mainGoal"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Main Goal</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="onDiabetesMedicationOrInsulin"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Medication Info</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex flex-col sm:flex-row gap-2 pt-2">
					<Button
						type="submit"
						disabled={isSubmitting}
						className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						className="w-full sm:w-auto"
					>
						Cancel
					</Button>
				</div>
			</form>
		</Form>
	);
}
