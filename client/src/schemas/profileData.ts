import { z } from "zod";

export const profileDataSchema = z.object({
	gender: z.enum(["male", "female"], {
		error: "Please select a gender",
	}),
	birthDay: z.string().min(1, "Day is required"),
	birthMonth: z.string().min(1, "Month is required"),
	birthYear: z.string().min(1, "Year is required"),
	diagnosisDay: z.string().min(1, "Day is required"),
	diagnosisMonth: z.string().min(1, "Month is required"),
	diagnosisYear: z.string().min(1, "Year is required"),
	weight: z
		.string()
		.superRefine((data, ctx) => {
			const weight = parseFloat(data);
			if (isNaN(weight) || weight <= 0) {
				ctx.addIssue({
					code: "custom",
					message: "Weight must be a positive number",
					path: ["weight"],
				});
			}
			const maxWeight = 1000;
			if (weight > maxWeight) {
				ctx.addIssue({
					code: "custom",
					message: "Weight must be less than 1000kg",
					path: ["weight"],
				});
			}
		})
		.min(1, "Weight is required"),
	height: z
		.string()
		.superRefine((data, ctx) => {
			const height = parseFloat(data);
			if (isNaN(height) || height < 0) {
				ctx.addIssue({
					code: "custom",
					message: "Height must be a positive number",
					path: ["height"],
				});
			}
			const maxHeight = 250;
			if (height > maxHeight) {
				ctx.addIssue({
					code: "custom",
					message: "Height must be less than 250cm",
					path: ["height"],
				});
			}
		})
		.min(1, "Height is required"),
	diabetesType: z.enum(["type1", "type2", "gestational", "prediabetes"], {
		error: "Please select diabetes type",
	}),
	firstName: z.string().min(1, "First name is required").optional(),
	lastName: z.string().min(1, "Last name is required").optional(),
});

export type ProfileDataFormValues = z.infer<typeof profileDataSchema>;
