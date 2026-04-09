import {
	CheckIcon,
	EyeIcon,
	EyeOffIcon,
	ArrowLeft,
	Loader2,
	Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import {
	useLogin,
	useVerify2FALogin,
	useRequestSignInCode,
} from "@/hooks/mutations/useLogin";
import { ROUTES } from "@/config/routes";

const SIGN_IN_CODE_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS = 3;

const socialButtons = [
	{
		icon: "/figmaAssets/social-icon---facebook.svg",
		alt: "Facebook",
		name: "Facebook",
	},
	{
		icon: "/figmaAssets/social-icon---google.svg",
		alt: "Google",
		name: "Google",
	},
	{
		icon: "/figmaAssets/social-icon---apple.svg",
		alt: "Apple",
		name: "Apple",
	},
];

function useResendCooldown(cooldownEnd: number | null) {
	const [secondsLeft, setSecondsLeft] = useState(0);
	useEffect(() => {
		if (cooldownEnd == null) {
			setSecondsLeft(0);
			return;
		}
		const tick = () => {
			const left = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
			setSecondsLeft(left);
			if (left <= 0) return;
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [cooldownEnd]);
	return secondsLeft;
}

function useCodeExpiry(expiresAt: number | null) {
	const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
	useEffect(() => {
		if (expiresAt == null) {
			setSecondsLeft(null);
			return;
		}
		const tick = () => {
			const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
			setSecondsLeft(left);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [expiresAt]);
	return secondsLeft;
}

export const LogIn = (): JSX.Element => {
	const [, navigate] = useLocation();
	const [showPassword, setShowPassword] = useState(false);
	const [show2FADialog, setShow2FADialog] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [userEmail, setUserEmail] = useState("");

	// Sign in with email (magic code) flow
	const [signInWithEmailMode, setSignInWithEmailMode] = useState(false);
	const [codeSent, setCodeSent] = useState(false);
	const [emailForCode, setEmailForCode] = useState("");
	const [signInCode, setSignInCode] = useState("");
	const [resendCount, setResendCount] = useState(0);
	const [resendCooldownEnd, setResendCooldownEnd] = useState<number | null>(
		null,
	);
	const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);

	const resendCooldownSeconds = useResendCooldown(resendCooldownEnd);
	const codeExpirySeconds = useCodeExpiry(codeExpiresAt);

	const { mutate: login, isPending } = useLogin();
	const { mutate: verify2FA, isPending: isVerifying2FA } = useVerify2FALogin();
	const { mutate: requestSignInCode, isPending: isSendingCode } =
		useRequestSignInCode();

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const emailValue = watch("email");

	const onSubmit = (data: LoginFormData) => {
		login(data, {
			onSuccess: (response) => {
				if (response.requiresTwoFactor) {
					setUserEmail(data.email);
					setShow2FADialog(true);
				}
			},
		});
	};

	const handleSendSignInCode = () => {
		const email = emailValue?.trim();
		if (!email || errors.email) return;
		requestSignInCode(email, {
			onSuccess: () => {
				setEmailForCode(email);
				setCodeSent(true);
				setSignInCode("");
				setResendCount(0);
				setResendCooldownEnd(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
				setCodeExpiresAt(Date.now() + SIGN_IN_CODE_EXPIRY_MINUTES * 60 * 1000);
			},
		});
	};

	const handleResendCode = () => {
		if (resendCount >= MAX_RESENDS || resendCooldownSeconds > 0) return;
		requestSignInCode(emailForCode, {
			onSuccess: () => {
				setResendCount((c) => c + 1);
				setResendCooldownEnd(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
				setCodeExpiresAt(Date.now() + SIGN_IN_CODE_EXPIRY_MINUTES * 60 * 1000);
				setSignInCode("");
			},
		});
	};

	const handleVerifySignInCode = () => {
		if (signInCode.length !== 6) return;
		login(
			{ email: emailForCode, emailSignInCode: signInCode },
			{
				onSuccess: (response) => {
					if (response.requiresTwoFactor) {
						setUserEmail(emailForCode);
						setShow2FADialog(true);
					}
				},
			},
		);
	};

	const handleBackToPassword = () => {
		setSignInWithEmailMode(false);
		setCodeSent(false);
		setEmailForCode("");
		setSignInCode("");
		setResendCount(0);
		setResendCooldownEnd(null);
		setCodeExpiresAt(null);
	};

	const handle2FAVerify = () => {
		if (verificationCode.length !== 6) {
			return;
		}
		verify2FA({ email: userEmail, token: verificationCode });
	};

	const handleSocialLogin = (platform: string) => {
		// Social login functionality to be implemented
	};

	const isEmailValid = emailValue && !errors.email;

	return (
		<div className="bg-white w-full min-h-screen lg:h-screen flex flex-col lg:flex-row">
			{/* Left Section - Hero Image (Hidden on mobile, shown on desktop) */}
			<section className="hidden lg:flex lg:w-1/2 lg:flex-shrink-0 lg:h-full relative bg-[#f7f9f9]">
				<Image
					className="absolute inset-0 w-full h-full object-cover"
					alt="Isens usa"
					src="/figmaAssets/isens-usa-8gg2pdqpkty-unsplash-2.png"
				/>

				<div className="absolute top-[55px] left-[57px] flex flex-col gap-[21px]">
					<h1 className="[font-family:'Open_Sauce_Sans-ExtraBold',Helvetica] font-extrabold text-white text-[64px] tracking-[-0.20px] leading-[normal]">
						Welcome to
					</h1>

					<div className="relative inline-flex items-center h-[79px]">
						<div
							className="absolute left-0 top-0 h-full bg-[#00856f] rounded-[5px] px-3"
							style={{ width: "auto", minWidth: "68.81%" }}
						/>
						<h2 className="relative px-3 [font-family:'Open_Sauce_Sans-ExtraBold',Helvetica] font-extrabold text-white text-[64px] tracking-[-0.20px] leading-[79px] whitespace-nowrap">
							Diabetes <span>360</span>
						</h2>
					</div>
				</div>
			</section>

			{/* Right Section - Login Form */}
			<section className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-full bg-white lg:bg-[#f7f9f9] flex items-center justify-center px-4 py-8 lg:py-12 lg:overflow-y-auto">
				<div className="w-full max-w-[447px] flex flex-col lg:my-auto">
					{/* Back Button - Only show on mobile */}
					<button
						className="lg:hidden flex items-center mb-6 text-black"
						onClick={() => navigate(ROUTES.HOME)}
						type="button"
						data-testid="button-back"
					>
						<ArrowLeft className="w-6 h-6" />
					</button>

					<h2
						className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-8 lg:mb-[77px]"
						data-testid="text-heading"
					>
						Log in
					</h2>

					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="flex flex-col gap-1.5 mb-[16px]">
							<Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
								Email address
							</Label>
							<div className="relative w-full lg:w-[353px]">
								<Input
									type="email"
									placeholder="helloworld@gmail.com"
									maxLength={50}
									disabled={codeSent}
									className={`w-full h-auto pl-4 ${isEmailValid ? "pr-12" : "pr-4"} py-[18px] bg-white rounded-[10px] border border-solid ${
										errors.email ? "border-red-500" : "border-[#d8dadc]"
									} [font-family:'Inter',Helvetica] font-normal text-black text-base truncate disabled:opacity-70 disabled:cursor-not-allowed`}
									{...register("email")}
									data-testid="input-email"
								/>
								{isEmailValid && !codeSent && (
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

						{!signInWithEmailMode && (
							<>
								<div className="flex flex-col gap-1.5 mb-6 lg:mb-[38px]">
									<Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
										Password
									</Label>
									<div className="relative w-full lg:w-[353px]">
										<Input
											type={showPassword ? "text" : "password"}
											placeholder="Enter your password"
											maxLength={128}
											className={`w-full h-auto pl-4 pr-12 py-[18px] bg-white rounded-[10px] border border-solid ${
												errors.password ? "border-red-500" : "border-[#d8dadc]"
											} [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
											{...register("password")}
											data-testid="input-password"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
											data-testid="button-toggle-password"
										>
											{showPassword ? (
												<EyeOffIcon className="w-5 h-5 text-gray-600" />
											) : (
												<EyeIcon className="w-5 h-5 text-gray-600" />
											)}
										</button>
									</div>
									{errors.password && (
										<span
											className="text-red-500 text-sm [font-family:'Inter',Helvetica]"
											data-testid="error-password"
										>
											{errors.password.message}
										</span>
									)}
								</div>

								<div className="flex justify-end w-full lg:w-[353px] mb-6 lg:mb-[38px]">
									<button
										type="button"
										onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
										className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]"
										data-testid="link-forgot-password"
									>
										Forgot password?
									</button>
								</div>
							</>
						)}

						{signInWithEmailMode && !codeSent && (
							<div className="mb-6 lg:mb-[38px]">
								<Button
									type="button"
									onClick={handleSendSignInCode}
									disabled={
										!emailValue?.trim() || !!errors.email || isSendingCode
									}
									className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] disabled:opacity-50"
									data-testid="button-send-sign-in-code"
								>
									{isSendingCode ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending code...
										</>
									) : (
										<>
											<Mail className="mr-2 h-4 w-4" />
											Send sign-in code
										</>
									)}
								</Button>
								<button
									type="button"
									onClick={handleBackToPassword}
									className="  mt-4 w-full text-start [font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline"
									data-testid="link-use-password"
								>
									Use password instead
								</button>
							</div>
						)}

						{signInWithEmailMode && codeSent && (
							<div className="mb-6 lg:mb-[38px] space-y-4">
								<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2]">
									We sent a 6-digit code to{" "}
									<span className="font-medium text-black">{emailForCode}</span>
								</p>
								<div className="flex flex-col gap-2">
									<Label className="[font-family:'Inter',Helvetica] text-sm">
										Enter code
									</Label>
									<div className="flex justify-start">
										<InputOTP
											maxLength={6}
											value={signInCode}
											onChange={setSignInCode}
										>
											<InputOTPGroup className="gap-1 sm:gap-2">
												<InputOTPSlot
													index={0}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white "
												/>
												<InputOTPSlot
													index={1}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white "
												/>
												<InputOTPSlot
													index={2}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base  bg-white "
												/>
												<InputOTPSlot
													index={3}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white "
												/>
												<InputOTPSlot
													index={4}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white"
												/>
												<InputOTPSlot
													index={5}
													className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white "
												/>
											</InputOTPGroup>
										</InputOTP>
									</div>
								</div>
								{codeExpirySeconds !== null && (
									<p
										className={`[font-family:'Inter',Helvetica] text-xs ${codeExpirySeconds === 0 ? "text-red-500" : "text-[#000000b2]"}`}
									>
										{codeExpirySeconds === 0
											? "Code expired. Request a new one below."
											: `Code expires in ${Math.floor(codeExpirySeconds / 60)}:${String(codeExpirySeconds % 60).padStart(2, "0")}`}
									</p>
								)}
								<div className="flex flex-col sm:flex-row items-center justify-between gap-2">
									<button
										type="button"
										onClick={handleResendCode}
										disabled={
											resendCount >= MAX_RESENDS || resendCooldownSeconds > 0
										}
										className="[font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline disabled:opacity-50 disabled:no-underline"
										data-testid="button-resend-code"
									>
										{resendCooldownSeconds > 0
											? `Resend code (${resendCooldownSeconds}s)`
											: resendCount >= MAX_RESENDS
												? "No resends left"
												: "Resend code"}
									</button>
									{resendCount > 0 && resendCount < MAX_RESENDS && (
										<span className="[font-family:'Inter',Helvetica] text-xs text-[#000000b2]">
											{MAX_RESENDS - resendCount} resend
											{MAX_RESENDS - resendCount === 1 ? "" : "s"} left
										</span>
									)}
								</div>
								<Button
									type="button"
									onClick={handleVerifySignInCode}
									disabled={
										signInCode.length !== 6 ||
										isPending ||
										(codeExpirySeconds !== null && codeExpirySeconds <= 0)
									}
									className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] disabled:opacity-50"
									data-testid="button-verify-sign-in-code"
								>
									{isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Signing in...
										</>
									) : (
										"Verify & sign in"
									)}
								</Button>
								<button
									type="button"
									onClick={handleBackToPassword}
									className="  mt-2 w-full text-start [font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline"
									data-testid="link-use-password-code-sent"
								>
									Use password instead
								</button>
							</div>
						)}

						{!signInWithEmailMode && (
							<>
								<Button
									type="submit"
									disabled={isPending}
									className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-3 disabled:opacity-50"
									data-testid="button-login"
								>
									<span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
										{isPending ? "Logging in..." : "Log in"}
									</span>
								</Button>
								<div className="flex items-center gap-2 w-full lg:w-[353px] mb-[19px]">
									<div className="flex-1 h-px bg-[#d8dadc]" />
									<span className="[font-family:'Inter',Helvetica] text-xs text-[#000000b2]">
										or
									</span>
									<div className="flex-1 h-px bg-[#d8dadc]" />
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={() => setSignInWithEmailMode(true)}
									className="w-full lg:w-[353px] h-12 border-[#00856f] text-[#00856f] hover:bg-[#00856f]/5 rounded-[10px]"
									data-testid="button-sign-in-with-email"
								>
									<Mail className="mr-2 h-4 w-4" />
									Sign in with email
								</Button>
							</>
						)}
					</form>

					{/* <div className="flex items-center gap-[9px] w-full lg:w-[353px] mb-[22px]">
						<Separator className="flex-1 bg-[#d8dadc]" />
						<span className="[font-family:'Inter',Helvetica] font-normal text-[#000000b2] text-sm tracking-[0] leading-[17.5px]">
							Or Login with
						</span>
						<Separator className="flex-1 bg-[#d8dadc]" />
					</div> */}

					{/* <div className="flex gap-[15px] mb-12 lg:mb-[117px] justify-center lg:justify-start">
						{socialButtons.map((social, index) => (
							<Button
								key={index}
								type="button"
								variant="outline"
								onClick={() => handleSocialLogin(social.name)}
								className="w-[108px] h-auto px-[45px] py-[18px] bg-white rounded-[10px] border border-solid border-[#00856f] hover:bg-[#00856f]/5"
								data-testid={`button-social-${social.name.toLowerCase()}`}
							>
								<Image className="w-5 h-5" alt={social.alt} src={social.icon} />
							</Button>
						))}
					</div> */}

					<div className="flex justify-center w-full lg:w-[353px]">
						<p className="[font-family:'Inter',Helvetica] font-normal text-sm tracking-[0] leading-[17.5px]">
							<span className="text-[#000000b2]">
								Don&apos;t have an account?
							</span>
							<span className="text-black">&nbsp;</span>
							<button
								type="button"
								onClick={() => navigate(ROUTES.SIGNUP)}
								className="font-semibold text-black"
								data-testid="link-signup"
							>
								Sign up
							</button>
						</p>
					</div>
				</div>
			</section>

			{/* 2FA Verification Dialog */}
			<Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
				<DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[400px]">
					<DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
						<DialogTitle className="text-lg sm:text-xl">
							Two-Factor Authentication
						</DialogTitle>
						<DialogDescription className="text-xs sm:text-sm">
							Enter the 6-digit code from your authenticator app
						</DialogDescription>
					</DialogHeader>
					<div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
						<div className="flex justify-center">
							<InputOTP
								maxLength={6}
								value={verificationCode}
								onChange={(value) => setVerificationCode(value)}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} className="bg-white" />
									<InputOTPSlot index={1} className="bg-white" />
									<InputOTPSlot index={2} className="bg-white" />
									<InputOTPSlot index={3} className="bg-white" />
									<InputOTPSlot index={4} className="bg-white" />
									<InputOTPSlot index={5} className="bg-white" />
								</InputOTPGroup>
							</InputOTP>
						</div>
						<Button
							onClick={handle2FAVerify}
							disabled={verificationCode.length !== 6 || isVerifying2FA}
							className="w-full bg-[#00856f] hover:bg-[#00856f]/90"
						>
							{isVerifying2FA ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify & Login"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
