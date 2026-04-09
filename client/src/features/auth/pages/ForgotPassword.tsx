import { ArrowLeft, CheckIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	forgotPasswordSchema,
	type ForgotPasswordFormData,
} from "@/schemas/auth.schema";
import { useForgotPassword } from "@/hooks/mutations/useForgotPassword";
import { ROUTES } from "@/config/routes";

export const ForgotPassword = (): JSX.Element => {
	const [, navigate] = useLocation();
	const [emailSent, setEmailSent] = useState(false);
	const { mutate: forgotPassword, isPending } = useForgotPassword();

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
		},
	});

	const emailValue = watch("email");
	const isEmailValid = emailValue && !errors.email;

	const onSubmit = (data: ForgotPasswordFormData) => {
		forgotPassword(data.email, {
			onSuccess: () => {
				setEmailSent(true);
			},
		});
	};

	if (emailSent) {
		return (
			<div className="bg-white lg:bg-[#f7f9f9] w-full min-h-screen flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-[447px] flex flex-col items-center text-center">
					<div className="w-16 h-16 rounded-full bg-[#00856f]/10 flex items-center justify-center mb-6">
						<CheckIcon className="w-8 h-8 text-[#00856f]" />
					</div>

					<h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-4">
						Check your email
					</h2>

					<p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm mb-8">
						We've sent a password reset link to your email address. Please check
						your inbox and follow the instructions.
					</p>

					<Button
						type="button"
						onClick={() => navigate(ROUTES.LOGIN)}
						className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px]"
						data-testid="button-back-to-login"
					>
						<span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
							Back to Log in
						</span>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white lg:bg-[#f7f9f9] w-full min-h-screen flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-[447px] flex flex-col">
				<button
					className="flex items-center mb-6 text-black"
					onClick={() => navigate(ROUTES.LOGIN)}
					type="button"
					data-testid="button-back"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>

				<h2
					className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-4"
					data-testid="text-heading"
				>
					Forgot Password
				</h2>

				<p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm mb-8">
					Enter your email address and we'll send you a link to reset your
					password.
				</p>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="flex flex-col gap-1.5 mb-6">
						<Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
							Email address
						</Label>
						<div className="relative w-full lg:w-[353px]">
							<Input
								type="email"
								placeholder="helloworld@gmail.com"
								maxLength={50}
								className={`w-full h-auto pl-4 ${isEmailValid ? "pr-12" : "pr-4"} py-[18px] bg-white rounded-[10px] border border-solid ${
									errors.email ? "border-red-500" : "border-[#d8dadc]"
								} [font-family:'Inter',Helvetica] font-normal text-black text-base`}
								{...register("email")}
								data-testid="input-email"
							/>
							{isEmailValid && (
								<CheckIcon
									className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00856f] pointer-events-none"
									data-testid="icon-email-valid"
								/>
							)}
						</div>
						{errors.email && (
							<span
								className="text-red-500 text-sm [font-family:'Inter',Helvetica]"
								data-testid="error-email"
							>
								{errors.email.message}
							</span>
						)}
					</div>

					<Button
						type="submit"
						disabled={isPending}
						className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-4 disabled:opacity-50"
						data-testid="button-submit"
					>
						<span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
							{isPending ? "Sending..." : "Send Reset Link"}
						</span>
					</Button>

					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => navigate(ROUTES.LOGIN)}
							className="[font-family:'Inter',Helvetica] text-start font-normal w-full  text-black text-sm"
							data-testid="link-back-to-login"
						>
							Back to <span className="font-semibold">Log in</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
