import { ArrowLeft } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPassword = (): JSX.Element => {
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    mode: "onChange",
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    console.log("Password reset requested for:", data.email);
    // TODO: Implement actual password reset logic
  };

  return (
    <div className="bg-white lg:bg-[#f7f9f9] w-full min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[447px] flex flex-col">
        <button
          className="flex items-center mb-6 text-black"
          onClick={() => navigate("/")}
          type="button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-4">
          Forgot Password
        </h2>

        <p className="[font-family:'Inter',Helvetica] font-normal text-gray-600 text-sm mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5 mb-6">
            <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
              Email address
            </Label>
            <Input
              type="email"
              placeholder="helloworld@gmail.com"
              className={`w-full h-auto px-4 py-[18px] bg-white rounded-[10px] border border-solid ${
                errors.email ? "border-red-500" : "border-[#d8dadc]"
              } [font-family:'Inter',Helvetica] font-normal text-black text-base`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <span className="text-red-500 text-sm [font-family:'Inter',Helvetica]">
                {errors.email.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-4"
          >
            <span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
              Send Reset Link
            </span>
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="[font-family:'Inter',Helvetica] font-normal text-black text-sm"
            >
              Back to <span className="font-semibold">Log in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
