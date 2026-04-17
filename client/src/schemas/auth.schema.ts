import { z } from "zod";

export const passwordSchema = z
	.string()
	.min(1, "Password is required")
	.min(8, "Password must be at least 8 characters")
	.max(128, "Password is too long")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/[0-9]/, "Password must contain at least one number")
	.regex(
		/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
		"Password must contain at least one special character",
	);

export const loginSchema = z.object({
	email: z.email("Invalid email address").max(70, "Email is too long"),
	password: passwordSchema,
});

export const signupSchema = z
	.object({
		firstName: z
			.string()
			.min(1, "First name is required")
			.min(2, "First name must be at least 2 characters")
			.max(100, "First name is too long")
			.regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
		lastName: z
			.string()
			.min(1, "Last name is required")
			.min(2, "Last name must be at least 2 characters")
			.max(100, "Last name is too long")
			.regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
		email: z
			.email("Invalid email address")
			.min(1, "Email is required")
			.max(70, "Email is too long"),
		password: passwordSchema,
		confirmPassword: passwordSchema,
		agreeToTerms: z
			.boolean()
			.refine(
				(val) => val === true,
				"You must agree to the terms and conditions",
			),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export const forgotPasswordSchema = z.object({
	email: z
		.email("Invalid email address")
		.min(1, "Email is required")
		.max(70, "Email is too long"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
