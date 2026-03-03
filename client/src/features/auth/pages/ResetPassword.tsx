import { ArrowLeft, EyeIcon, EyeOffIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/hooks/mutations/useResetPassword";
import { ROUTES } from "@/config/routes";
import { passwordSchema } from "@/schemas/auth.schema";

const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
	const [, navigate] = useLocation();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const searchString = useSearch();

	const resetPasswordMutation = useResetPassword();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordForm>({
		resolver: zodResolver(resetPasswordSchema),
		mode: "onChange",
	});

	// Get token from URL parameters
	const urlParams = new URLSearchParams(searchString);
	const token = urlParams.get("token");

	if (!token) {
		return (
			<div className="bg-white lg:bg-[#f7f9f9] w-full min-h-screen flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-[447px] flex flex-col items-center text-center">
					<div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
						<AlertCircle className="w-8 h-8 text-amber-600" />
					</div>

					<h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-4">
						Invalid Reset Link
					</h2>

					<p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm mb-8">
						The password reset link is invalid or has expired. Please request a new
						link to reset your password.
					</p>

					<Button
						type="button"
						onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
						className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px]"
					>
						<span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
							Request New Reset Link
						</span>
					</Button>

					<button
						type="button"
						onClick={() => navigate(ROUTES.LOGIN)}
						className="mt-6 [font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm hover:text-[#00856f] transition-colors"
					>
						Back to <span className="font-semibold text-black">Log in</span>
					</button>
				</div>
			</div>
		);
	}

	const onSubmit = async (data: ResetPasswordForm) => {
		try {
			await resetPasswordMutation.mutateAsync({
				token,
				password: data.password,
			});
			navigate(ROUTES.LOGIN);
		} catch {
			// Error is handled by the mutation hook
		}
	};

	const inputBaseClass =
		"w-full h-auto pl-4 pr-12 py-[18px] bg-white rounded-[10px] border border-solid [font-family:'Inter',Helvetica] font-normal text-black text-base";

	return (
		<div className="bg-white lg:bg-[#f7f9f9] w-full min-h-screen flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-[447px] flex flex-col">
				<button
					className="flex items-center mb-6 text-black hover:text-[#00856f] transition-colors"
					onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
					type="button"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>

				<h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-4">
					Reset Password
				</h2>

				<p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm mb-8">
					Enter your new password below. Use at least 6 characters.
				</p>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="flex flex-col gap-1.5 mb-[16px]">
						<Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
							New Password
						</Label>
						<div className="relative w-full lg:w-[353px]">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Enter new password"
								disabled={resetPasswordMutation.isPending}
								className={`${inputBaseClass} ${errors.password ? "border-red-500" : "border-[#d8dadc]"}`}
								{...register("password")}
							/>
							<button
								type="button"
								onClick={() => setShowPassword((p) => !p)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00856f] transition-colors"
								tabIndex={-1}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOffIcon className="w-5 h-5" />
								) : (
									<EyeIcon className="w-5 h-5" />
								)}
							</button>
						</div>
						{errors.password && (
							<span className="text-red-500 text-sm [font-family:'Inter',Helvetica]">
								{errors.password.message}
							</span>
						)}
					</div>

					<div className="flex flex-col gap-1.5 mb-6">
						<Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
							Confirm Password
						</Label>
						<div className="relative w-full lg:w-[353px]">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								placeholder="Confirm new password"
								disabled={resetPasswordMutation.isPending}
								className={`${inputBaseClass} ${errors.confirmPassword ? "border-red-500" : "border-[#d8dadc]"}`}
								{...register("confirmPassword")}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword((p) => !p)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00856f] transition-colors"
								tabIndex={-1}
								aria-label={showConfirmPassword ? "Hide password" : "Show password"}
							>
								{showConfirmPassword ? (
									<EyeOffIcon className="w-5 h-5" />
								) : (
									<EyeIcon className="w-5 h-5" />
								)}
							</button>
						</div>
						{errors.confirmPassword && (
							<span className="text-red-500 text-sm [font-family:'Inter',Helvetica]">
								{errors.confirmPassword.message}
							</span>
						)}
					</div>

					<Button
						type="submit"
						disabled={resetPasswordMutation.isPending}
						className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-4 disabled:opacity-50"
					>
						<span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
							{resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
						</span>
					</Button>

					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => navigate(ROUTES.LOGIN)}
							className="[font-family:'Inter',Helvetica] font-normal text-black text-sm hover:text-[#00856f] transition-colors"
						>
							Back to <span className="font-semibold">Log in</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
