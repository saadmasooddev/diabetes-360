import { CheckIcon, EyeIcon, EyeOffIcon, ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

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

interface LoginFormData {
  email: string;
  password: string;
}

export const LogIn = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  const onSubmit = (data: LoginFormData) => {
    console.log("Form submitted:", data);
  };

  const handleSocialLogin = (platform: string) => {
    console.log(`${platform} login clicked`);
  };

  const isEmailValid = emailValue && !errors.email;

  return (
    <div className="bg-white w-full min-h-screen lg:h-screen flex flex-col lg:flex-row">
      {/* Left Section - Hero Image (Hidden on mobile, shown on desktop) */}
      <section className="hidden lg:flex lg:w-1/2 lg:flex-shrink-0 lg:h-full relative bg-[#f7f9f9]">
        <img
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

      {/* Right Section - Login Form */}
      <section className="w-full lg:w-1/2 lg:flex-shrink-0 lg:h-full bg-white lg:bg-[#f7f9f9] flex items-center justify-center px-4 py-8 lg:py-12 lg:overflow-y-auto">
        <div className="w-full max-w-[447px] flex flex-col lg:my-auto">
          {/* Back Button - Only show on mobile */}
          <button 
            className="lg:hidden flex items-center mb-6 text-black"
            onClick={() => navigate("/")}
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-8 lg:mb-[77px]">
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
                  className={`w-full h-auto pl-4 ${isEmailValid ? 'pr-12' : 'pr-4'} py-[18px] bg-white rounded-[10px] border border-solid ${
                    errors.email
                      ? "border-red-500"
                      : "border-[#d8dadc]"
                  } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                    maxLength: {
                      value: 50,
                      message: "Email is too long",
                    },
                  })}
                />
                {isEmailValid && (
                  <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00856f] pointer-events-none" />
                )}
              </div>
              {errors.email && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]">
                  {errors.email.message}
                </span>
              )}
            </div>

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
                    errors.password
                      ? "border-red-500"
                      : "border-[#d8dadc]"
                  } [font-family:'Inter',Helvetica] font-normal text-black text-base truncate`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    maxLength: {
                      value: 128,
                      message: "Password is too long",
                    },
                    validate: {
                      hasUpperCase: (value) =>
                        /[A-Z]/.test(value) || "Password must contain at least one uppercase letter",
                      hasLowerCase: (value) =>
                        /[a-z]/.test(value) || "Password must contain at least one lowercase letter",
                      hasNumber: (value) =>
                        /[0-9]/.test(value) || "Password must contain at least one number",
                      hasSpecialChar: (value) =>
                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ||
                        "Password must contain at least one special character",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex justify-end w-full lg:w-[353px] mb-6 lg:mb-[38px]">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-[19px]"
            >
              <span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
                Log in
              </span>
            </Button>
          </form>

          <div className="flex items-center gap-[9px] w-full lg:w-[353px] mb-[22px]">
            <Separator className="flex-1 bg-[#d8dadc]" />
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#000000b2] text-sm tracking-[0] leading-[17.5px]">
              Or Login with
            </span>
            <Separator className="flex-1 bg-[#d8dadc]" />
          </div>

          <div className="flex gap-[15px] mb-12 lg:mb-[117px] justify-center lg:justify-start">
            {socialButtons.map((social, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin(social.name)}
                className="w-[108px] h-auto px-[45px] py-[18px] bg-white rounded-[10px] border border-solid border-[#00856f] hover:bg-[#00856f]/5"
              >
                <img className="w-5 h-5" alt={social.alt} src={social.icon} />
              </Button>
            ))}
          </div>

          <div className="flex justify-center w-full lg:w-[353px]">
            <p className="[font-family:'Inter',Helvetica] font-normal text-sm tracking-[0] leading-[17.5px]">
              <span className="text-[#000000b2]">
                Don&apos;t have an account?
              </span>
              <span className="text-black">&nbsp;</span>
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-semibold text-black"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
