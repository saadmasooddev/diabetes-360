import { CheckIcon, EyeIcon, EyeOffIcon, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signupSchema, type SignupFormData } from "@/schemas/auth.schema";
import { useSignup } from "@/hooks/mutations/useSignup";
import { ROUTES } from "@/config/routes";

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

export const SignUp = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const firstNameValue = watch("firstName");
  const lastNameValue = watch("lastName");
  const emailValue = watch("email");
  const agreeToTermsValue = watch("agreeToTerms");

  const onSubmit = (data: SignupFormData) => {
    signup({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });
  };

  const handleSocialSignup = (platform: string) => {
    console.log(`${platform} signup clicked`);
  };

  const isFirstNameValid = firstNameValue && !errors.firstName;
  const isLastNameValid = lastNameValue && !errors.lastName;
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
            <div className="absolute left-0 top-0 h-full bg-[#00856f] rounded-[5px] px-3" style={{ width: 'auto', minWidth: '68.81%' }} />
            <h2 className="relative px-3 [font-family:'Open_Sauce_Sans-ExtraBold',Helvetica] font-extrabold text-white text-[64px] tracking-[-0.20px] leading-[79px] whitespace-nowrap">
              Diabetes <span>360</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Right Section - Signup Form */}
      <section className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-full bg-white lg:bg-[#f7f9f9] flex items-center justify-center px-4 py-8 lg:py-12 lg:overflow-y-auto">
        <div className="w-full max-w-[447px] flex flex-col lg:my-auto">
          {/* Back Button - Only show on mobile */}
          <button
            className="lg:hidden flex items-center mb-6 text-black"
            onClick={() => navigate(ROUTES.LOGIN)}
            type="button"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-8 lg:mb-[77px]" data-testid="text-heading">
            Sign up
          </h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* First Name Field */}
            <div className="flex flex-col gap-1.5 mb-[16px]">
              <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
                First Name
              </Label>
              <div className="relative w-full lg:w-[353px]">
                <Input
                  type="text"
                  placeholder="John"
                  maxLength={100}
                  className={`w-full h-auto pl-4 ${isFirstNameValid ? 'pr-12' : 'pr-4'} py-[18px] bg-white rounded-[10px] border border-solid ${errors.firstName
                    ? "border-red-500"
                    : "border-[#d8dadc]"
                    } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("firstName")}
                  data-testid="input-firstname"
                />
                {isFirstNameValid && (
                  <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00856f] pointer-events-none" data-testid="icon-firstname-valid" />
                )}
              </div>
              {errors.firstName && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]" data-testid="error-firstname">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Last Name Field */}
            <div className="flex flex-col gap-1.5 mb-[16px]">
              <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
                Last Name
              </Label>
              <div className="relative w-full lg:w-[353px]">
                <Input
                  type="text"
                  placeholder="Doe"
                  maxLength={100}
                  className={`w-full h-auto pl-4 ${isLastNameValid ? 'pr-12' : 'pr-4'} py-[18px] bg-white rounded-[10px] border border-solid ${errors.lastName
                    ? "border-red-500"
                    : "border-[#d8dadc]"
                    } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("lastName")}
                  data-testid="input-lastname"
                />
                {isLastNameValid && (
                  <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00856f] pointer-events-none" data-testid="icon-lastname-valid" />
                )}
              </div>
              {errors.lastName && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]" data-testid="error-lastname">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5 mb-[16px]">
              <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
                Email address
              </Label>
              <div className="relative w-full lg:w-[353px]">
                <Input
                  type="email"
                  placeholder="helloworld@gmail.com"
                  maxLength={50}
                  className={`w-full h-auto pl-4 ${isEmailValid ? 'pr-12' : 'pr-4'} py-[18px] bg-white rounded-[10px] border border-solid ${errors.email
                    ? "border-red-500"
                    : "border-[#d8dadc]"
                    } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("email")}
                  data-testid="input-email"
                />
                {isEmailValid && (
                  <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00856f] pointer-events-none" data-testid="icon-email-valid" />
                )}
              </div>
              {errors.email && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]" data-testid="error-email">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5 mb-[16px]">
              <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
                Password
              </Label>
              <div className="relative w-full lg:w-[353px]">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  maxLength={128}
                  className={`w-full h-auto pl-4 pr-12 py-[18px] bg-white rounded-[10px] border border-solid ${errors.password
                    ? "border-red-500"
                    : "border-[#d8dadc]"
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
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]" data-testid="error-password">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5 mb-[16px]">
              <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
                Confirm Password
              </Label>
              <div className="relative w-full lg:w-[353px]">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  maxLength={128}
                  className={`w-full h-auto pl-4 pr-12 py-[18px] bg-white rounded-[10px] border border-solid ${errors.confirmPassword
                    ? "border-red-500"
                    : "border-[#d8dadc]"
                    } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("confirmPassword")}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]" data-testid="error-confirm-password">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2 w-full lg:w-[353px] mb-6 lg:mb-[38px]">
              <Checkbox
                id="agreeToTerms"
                checked={agreeToTermsValue}
                onCheckedChange={(checked) => {
                  const event = {
                    target: {
                      name: "agreeToTerms",
                      value: checked,
                    },
                  };
                  register("agreeToTerms").onChange(event);
                }}
                className="mt-0.5"
                data-testid="checkbox-terms"
              />
              <Label
                htmlFor="agreeToTerms"
                className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px] cursor-pointer"
              >
                I agree to the{" "}
                <button
                  type="button"
                  className="font-semibold text-[#00856f] underline"
                  onClick={() => console.log("Terms clicked")}
                  data-testid="link-terms"
                >
                  Terms and Conditions
                </button>
              </Label>
            </div>
            {errors.agreeToTerms && (
              <span className="text-red-500 text-sm [font-family:'Inter',Helvetica] block -mt-4 mb-4" data-testid="error-terms">
                {errors.agreeToTerms.message}
              </span>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-[19px] disabled:opacity-50"
              data-testid="button-signup"
            >
              <span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
                {isPending ? "Creating account..." : "Sign up"}
              </span>
            </Button>
          </form>

          <div className="flex items-center gap-[9px] w-full lg:w-[353px] mb-[22px]">
            <Separator className="flex-1 bg-[#d8dadc]" />
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#000000b2] text-sm tracking-[0] leading-[17.5px]">
              Or Sign up with
            </span>
            <Separator className="flex-1 bg-[#d8dadc]" />
          </div>

          <div className="flex gap-[15px] mb-12 lg:mb-[117px] justify-center lg:justify-start">
            {socialButtons.map((social, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                onClick={() => handleSocialSignup(social.name)}
                className="w-[108px] h-auto px-[45px] py-[18px] bg-white rounded-[10px] border border-solid border-[#00856f] hover:bg-[#00856f]/5"
                data-testid={`button-social-${social.name.toLowerCase()}`}
              >
                <Image className="w-5 h-5" alt={social.alt} src={social.icon} />
              </Button>
            ))}
          </div>

          <div className="flex justify-center w-full lg:w-[353px]">
            <p className="[font-family:'Inter',Helvetica] font-normal text-sm tracking-[0] leading-[17.5px]">
              <span className="text-[#000000b2]">
                Already have an account?
              </span>
              <span className="text-black">&nbsp;</span>
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
