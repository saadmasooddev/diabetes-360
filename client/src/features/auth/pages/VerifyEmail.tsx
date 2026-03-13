import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	useVerifyEmail,
	useResendVerificationOtp,
} from "@/hooks/mutations/useSignup";
import { ROUTES } from "@/config/routes";

const VERIFY_CODE_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS = 3;

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

export const VerifyEmail = (): JSX.Element => {
	const [, navigate] = useLocation();
	const searchString = useSearch();
	const [code, setCode] = useState("");
	const [resendCount, setResendCount] = useState(0);
	const [resendCooldownEnd, setResendCooldownEnd] = useState<number | null>(
		null,
	);
	const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(() =>
		typeof window !== "undefined"
			? Date.now() + VERIFY_CODE_EXPIRY_MINUTES * 60 * 1000
			: null,
	);

	const resendCooldownSeconds = useResendCooldown(resendCooldownEnd);
	const codeExpirySeconds = useCodeExpiry(codeExpiresAt);

	const email = (() => {
		const params = new URLSearchParams(
			searchString.startsWith("?") ? searchString.slice(1) : searchString,
		);
		return params.get("email") ?? "";
	})();

	const { mutate: verifyEmail, isPending } = useVerifyEmail();
	const { mutate: resendOtp, isPending: isResending } =
		useResendVerificationOtp();

	useEffect(() => {
		if (!email) {
			navigate(ROUTES.SIGNUP);
		}
	}, [email, navigate]);

	const handleVerify = () => {
		if (code.length !== 6 || !email) return;
		verifyEmail({ email, code });
	};

	const handleResend = () => {
		if (!email || resendCount >= MAX_RESENDS || resendCooldownSeconds > 0)
			return;
		resendOtp(email, {
			onSuccess: (data) => {
				if (data.otpSent) {
					setResendCount((c) => c + 1);
					setResendCooldownEnd(
						Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
					);
					setCodeExpiresAt(
						Date.now() + VERIFY_CODE_EXPIRY_MINUTES * 60 * 1000,
					);
					setCode("");
				}
			},
		});
	};

	if (!email) {
		return (
			<div className="bg-white w-full min-h-screen flex items-center justify-center">
				<p className="text-[#000000b2]">Redirecting to sign up...</p>
			</div>
		);
	}

	return (
		<div className="bg-white w-full min-h-screen lg:h-screen flex flex-col lg:flex-row">
			<section className="hidden lg:flex lg:w-1/2 lg:flex-shrink-0 lg:h-full relative bg-[#f7f9f9]">
				<Image
					className="absolute inset-0 w-full h-full object-cover"
					alt="Welcome"
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

			<section className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-full bg-white lg:bg-[#f7f9f9] flex items-center justify-center px-4 py-8 lg:py-12 lg:overflow-y-auto">
				<div className="w-full max-w-[447px] flex flex-col lg:my-auto">
					<button
						className="lg:hidden flex items-center mb-6 text-black"
						onClick={() => navigate(ROUTES.SIGNUP)}
						type="button"
						data-testid="button-back"
					>
						<ArrowLeft className="w-6 h-6" />
					</button>

					<h2
						className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-8 lg:mb-[77px]"
						data-testid="text-heading"
					>
						Verify your email
					</h2>

					<div className="mb-6 lg:mb-[38px] space-y-4">
						<p className="[font-family:'Inter',Helvetica] text-sm text-[#000000b2]">
							We sent a 6-digit code to{" "}
							<span className="font-medium text-black">{email}</span>
						</p>
						<div className="flex flex-col gap-2">
							<Label className="[font-family:'Inter',Helvetica] text-sm">
								Enter code
							</Label>
							<div className="flex justify-start">
								<InputOTP
									maxLength={6}
									value={code}
									onChange={setCode}
								>
									<InputOTPGroup className="gap-1 sm:gap-2">
										<InputOTPSlot index={0} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
										<InputOTPSlot index={1} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
										<InputOTPSlot index={2} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
										<InputOTPSlot index={3} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
										<InputOTPSlot index={4} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
										<InputOTPSlot index={5} className="h-12 w-10 sm:w-12 rounded-[10px] border-[#d8dadc] text-base bg-white" />
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
								onClick={handleResend}
								disabled={
									resendCount >= MAX_RESENDS ||
									resendCooldownSeconds > 0 ||
									isResending
								}
								className="[font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline disabled:opacity-50 disabled:no-underline"
								data-testid="button-resend-code"
							>
								{resendCooldownSeconds > 0
									? `Resend code (${resendCooldownSeconds}s)`
									: resendCount >= MAX_RESENDS
										? "No resends left"
										: isResending
											? "Sending..."
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
							onClick={handleVerify}
							disabled={
								code.length !== 6 ||
								isPending ||
								(codeExpirySeconds !== null && codeExpirySeconds <= 0)
							}
							className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] disabled:opacity-50"
							data-testid="button-verify-email"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify & continue"
							)}
						</Button>
						<button
							type="button"
							onClick={() => navigate(ROUTES.SIGNUP)}
							className="mt-2 w-full text-start [font-family:'Inter',Helvetica] text-sm text-[#00856f] hover:underline"
							data-testid="link-back-signup"
						>
							Back to sign up
						</button>
					</div>

					<div className="flex justify-center w-full lg:w-[353px]">
						<p className="[font-family:'Inter',Helvetica] font-normal text-sm tracking-[0] leading-[17.5px]">
							<span className="text-[#000000b2]">Already verified?</span>{" "}
							<button
								type="button"
								onClick={() => navigate(ROUTES.LOGIN)}
								className="font-semibold text-black"
								data-testid="link-login"
							>
								Log in
							</button>
						</p>
					</div>
				</div>
			</section>
		</div>
	);
};
