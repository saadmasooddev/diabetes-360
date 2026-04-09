import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/mutations/useLogout";
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
	yesNoNotSureOptions,
	bloodSugarTypeOptions,
	weightOptions,
	heightOptions,
} from "@/mocks/profileData";
import {
	useCreateCustomerData,
	useGetCustomerData,
	useUpdateCustomerData,
} from "@/hooks/mutations/useCustomer";
import { useState, useEffect } from "react";
import { parseDateToComponents } from "@/lib/utils";
import { ButtonSpinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
	DIABETES_TYPE,
	ProfileDataFormValues,
	YES_NO_NOT_SURE_VALUES,
	profileDataSchema,
} from "@shared/schema";

export function ProfileData() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const logoutMutation = useLogout();

	const { data: existingData } = useGetCustomerData();
	const createCustomerData = useCreateCustomerData();
	const updateCustomerData = useUpdateCustomerData();

	const form = useForm<ProfileDataFormValues>({
		resolver: zodResolver(profileDataSchema),
		defaultValues: {
			gender: undefined,
			birthDay: "",
			birthMonth: "",
			birthYear: "",
			weight: "",
			height: "",
			diabetesType: DIABETES_TYPE.PREDIABETES,
			doctorToldDiabetes: undefined,
			knowsBloodSugarValue: undefined,
			bloodSugarType: undefined,
			bloodSugarReading: "",
			onDiabetesMedicationOrInsulin: "",
			mainGoal: "",
		},
	});

	const knowsBloodSugarValue = form.watch("knowsBloodSugarValue");

	// Populate form with existing data if available
	useEffect(() => {
		const {
			day: birthDay,
			month: birthMonth,
			year: birthYear,
		} = parseDateToComponents(existingData?.customerData?.birthday || "");

		if (existingData?.customerData) {
			const data = existingData.customerData;
			form.reset({
				gender: data.gender as "male" | "female",
				birthDay: birthDay,
				birthMonth: birthMonth,
				birthYear: birthYear,
				weight: data.weight,
				height: data.height,
				diabetesType:
					(data.diabetesType as DIABETES_TYPE) || DIABETES_TYPE.PREDIABETES,
				knowsBloodSugarValue: undefined,
				bloodSugarType: undefined,
				bloodSugarReading: "",
				onDiabetesMedicationOrInsulin: data.medicationInfo || "",
				mainGoal: data.mainGoal || "",
				doctorToldDiabetes: data.diabetesType
					? YES_NO_NOT_SURE_VALUES.YES
					: undefined,
			});
		}
	}, [existingData, form]);

	const onSubmit = async (data: ProfileDataFormValues) => {
		setIsSubmitting(true);
		try {
			if (existingData?.customerData) {
				// Update existing profile
				await updateCustomerData.mutateAsync(data);
			} else {
				// Create new profile
				await createCustomerData.mutateAsync(data);
			}
		} catch (error) {
			// Error handling is done in the mutation hooks
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			{/* Logout Button - Top Right */}
			<Button
				variant="ghost"
				onClick={() => logoutMutation.mutate()}
				disabled={logoutMutation.isPending}
				className="fixed top-4 right-4 z-50 text-red-600 hover:text-red-700 hover:bg-red-50"
				data-testid="button-logout-profile"
			>
				<LogOut className="mr-2 h-4 w-4" />
				{logoutMutation.isPending ? "Logging out..." : "Logout"}
			</Button>

			{/* Left Sidebar - Hidden on mobile, visible on large screens */}
			<div
				className="hidden lg:flex w-[309px] items-center justify-center px-8"
				style={{ background: "#00856F" }}
			>
				<h1
					className="text-white font-bold leading-[130%] tracking-[-0.01em] text-3xl lg:text-[48px]"
					style={{
						fontFamily: "'Open Sauce Sans', sans-serif",
					}}
					data-testid="text-sidebar-heading"
				>
					Help our App understand you!
				</h1>
			</div>

			{/* Main Content */}
			<main className="flex-1 px-4 sm:px-8 lg:px-16 py-8 lg:py-12">
				<div className="max-w-full mx-auto">
					{/* Page Title */}
					<h1
						className="font-bold leading-[130%] tracking-[-0.01em] mb-8 lg:mb-12 text-3xl sm:text-4xl lg:text-[48px]"
						style={{
							fontFamily: "'Open Sauce Sans', sans-serif",
							color: "#00856F",
						}}
						data-testid="text-page-heading"
					>
						Tell Us about Yourself
					</h1>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-8 lg:space-y-12"
						>
							{/* Personal Details Section */}
							<div>
								<h2
									className="font-bold leading-[130%] tracking-[-0.01em] mb-6 lg:mb-8 text-2xl sm:text-3xl lg:text-[32px]"
									style={{
										fontFamily: "'Open Sauce Sans', sans-serif",
										color: "#00856F",
									}}
									data-testid="text-personal-details"
								>
									Personal Details
								</h2>

								<div className="space-y-6">
									{/* Gender and Date of Birth Row */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="gender"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className="text-[20px] font-normal"
														style={{ fontFamily: "'Inter', sans-serif" }}
													>
														Gender
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger
																className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
																style={{ fontFamily: "'Inter', sans-serif" }}
																data-testid="select-gender"
															>
																<SelectValue placeholder="Male/Female" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{genderOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																	data-testid={`option-gender-${option.value}`}
																>
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
											<FormLabel
												className="text-[20px] font-normal block mb-2"
												style={{ fontFamily: "'Inter', sans-serif" }}
											>
												Date of Birth
											</FormLabel>
											<div className="grid grid-cols-3 gap-3">
												<FormField
													control={form.control}
													name="birthDay"
													render={({ field }) => (
														<FormItem>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger
																		className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
																		style={{
																			fontFamily: "'Inter', sans-serif",
																		}}
																		data-testid="select-birth-day"
																	>
																		<SelectValue placeholder="DD" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{dayOptions.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																			data-testid={`option-birth-day-${option.value}`}
																		>
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
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger
																		className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
																		style={{
																			fontFamily: "'Inter', sans-serif",
																		}}
																		data-testid="select-birth-month"
																	>
																		<SelectValue placeholder="MM" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{monthOptions.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																			data-testid={`option-birth-month-${option.value}`}
																		>
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
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger
																		className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
																		style={{
																			fontFamily: "'Inter', sans-serif",
																		}}
																		data-testid="select-birth-year"
																	>
																		<SelectValue placeholder="YYYY" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{yearOptions.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																			data-testid={`option-birth-year-${option.value}`}
																		>
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
									</div>
									<div className="grid grid-cols-2 gap-3">
										<FormField
											control={form.control}
											name="weight"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className="text-[20px] font-normal"
														style={{ fontFamily: "'Inter', sans-serif" }}
													>
														Weight(kg)
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger
																className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
																style={{ fontFamily: "'Inter', sans-serif" }}
																data-testid="select-weight"
															>
																<SelectValue placeholder="0" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{weightOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																	data-testid={`option-weight-${option.value}`}
																>
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
													<FormLabel
														className="text-[20px] font-normal"
														style={{ fontFamily: "'Inter', sans-serif" }}
													>
														Height(cm)
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger
																className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
																style={{ fontFamily: "'Inter', sans-serif" }}
																data-testid="select-height"
															>
																<SelectValue placeholder="0" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{heightOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																	data-testid={`option-height-${option.value}`}
																>
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
							</div>

							{/* Diagnosis Section */}
							<div>
								<h2
									className="font-bold leading-[130%] tracking-[-0.01em] mb-6 lg:mb-8 text-2xl sm:text-3xl lg:text-[32px]"
									style={{
										fontFamily: "'Open Sauce Sans', sans-serif",
										color: "#00856F",
									}}
									data-testid="text-diagnosis"
								>
									Diagnosis
								</h2>

								<div className="space-y-6">
									{/* Type of Diabetes */}
									<div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="diabetesType"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className="text-[20px] font-normal"
														style={{ fontFamily: "'Inter', sans-serif" }}
													>
														What best describes you today?
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														defaultValue={DIABETES_TYPE.PREDIABETES}
													>
														<FormControl>
															<SelectTrigger
																className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
																style={{ fontFamily: "'Inter', sans-serif" }}
																data-testid="select-diabetes-type"
															>
																<SelectValue placeholder={"Prediabetes"} />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{diabetesTypeOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																	data-testid={`option-diabetes-${option.value}`}
																>
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

									{/* Has a doctor ever told you that you have diabetes? */}
									<FormField
										control={form.control}
										name="doctorToldDiabetes"
										render={({ field }) => (
											<FormItem>
												<FormLabel
													className="text-[20px] font-normal"
													style={{ fontFamily: "'Inter', sans-serif" }}
												>
													Has a doctor ever told you that you have diabetes?
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger
															className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
															style={{ fontFamily: "'Inter', sans-serif" }}
															data-testid="select-doctor-told-diabetes"
														>
															<SelectValue placeholder="Yes / No / Not sure" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{yesNoNotSureOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
																data-testid={`option-doctor-told-${option.value}`}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Do you know any recent blood sugar value? */}
									<FormField
										control={form.control}
										name="knowsBloodSugarValue"
										render={({ field }) => (
											<FormItem>
												<FormLabel
													className="text-[20px] font-normal"
													style={{ fontFamily: "'Inter', sans-serif" }}
												>
													Do you know any recent blood sugar value?
												</FormLabel>
												<Select
													onValueChange={(value) => {
														field.onChange(value);
														if (value !== "yes") {
															form.setValue("bloodSugarType", undefined);
															form.setValue("bloodSugarReading", "");
														}
													}}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger
															className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
															style={{ fontFamily: "'Inter', sans-serif" }}
															data-testid="select-knows-blood-sugar"
														>
															<SelectValue placeholder="Yes / No / Not sure" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{yesNoNotSureOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
																data-testid={`option-knows-blood-sugar-${option.value}`}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{knowsBloodSugarValue === "yes" && (
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
														<FormField
															control={form.control}
															name="bloodSugarType"
															render={({ field: typeField }) => (
																<FormItem>
																	<FormLabel
																		className="text-[16px] font-normal"
																		style={{
																			fontFamily: "'Inter', sans-serif",
																		}}
																	>
																		Type
																	</FormLabel>
																	<Select
																		onValueChange={typeField.onChange}
																		value={typeField.value}
																	>
																		<FormControl>
																			<SelectTrigger
																				className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
																				style={{
																					fontFamily: "'Inter', sans-serif",
																				}}
																				data-testid="select-blood-sugar-type"
																			>
																				<SelectValue placeholder="Fasting / Random / HbA1c" />
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent>
																			{bloodSugarTypeOptions.map((option) => (
																				<SelectItem
																					key={option.value}
																					value={option.value}
																					data-testid={`option-blood-sugar-type-${option.value}`}
																				>
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
															name="bloodSugarReading"
															render={({ field: readingField }) => (
																<FormItem>
																	<FormLabel
																		className="text-[16px] font-normal"
																		style={{
																			fontFamily: "'Inter', sans-serif",
																		}}
																	>
																		Reading
																	</FormLabel>
																	<FormControl>
																		<Input
																			type="number"
																			placeholder="Enter number"
																			className="h-[56px] rounded-[10px] bg-white border-[#D8DADC] text-[16px]"
																			style={{
																				fontFamily: "'Inter', sans-serif",
																			}}
																			data-testid="input-blood-sugar-reading"
																			{...readingField}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Currently on diabetes medication or insulin? */}
									<FormField
										control={form.control}
										name="onDiabetesMedicationOrInsulin"
										render={({ field }) => (
											<FormItem>
												<FormLabel
													className="text-[20px] font-normal"
													style={{ fontFamily: "'Inter', sans-serif" }}
												>
													Currently on diabetes medication or insulin?
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Text"
														className="h-[56px] rounded-[10px] border-[#D8DADC] bg-white text-[16px]"
														style={{ fontFamily: "'Inter', sans-serif" }}
														data-testid="input-diabetes-medication"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Main goal right now? */}
									<FormField
										control={form.control}
										name="mainGoal"
										render={({ field }) => (
											<FormItem>
												<FormLabel
													className="text-[20px] font-normal"
													style={{ fontFamily: "'Inter', sans-serif" }}
												>
													Main goal right now?
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Text"
														className="h-[56px] rounded-[10px] bg-white border-[#D8DADC] text-[16px]"
														style={{ fontFamily: "'Inter', sans-serif" }}
														data-testid="input-main-goal"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full h-[56px] rounded-[10px] text-white text-[18px] font-semibold"
								style={{
									background: "#00856F",
									fontFamily: "'Inter', sans-serif",
								}}
								data-testid="button-submit-details"
							>
								{isSubmitting ? (
									<>
										<ButtonSpinner className="mr-2" />
										Submitting...
									</>
								) : (
									"Submit Details"
								)}
							</Button>
						</form>
					</Form>
				</div>
			</main>
		</div>
	);
}
