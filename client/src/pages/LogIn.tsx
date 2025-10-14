import { CheckIcon, EyeIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const socialButtons = [
  {
    icon: "/figmaAssets/social-icon---facebook.svg",
    alt: "Facebook",
  },
  {
    icon: "/figmaAssets/social-icon---google.svg",
    alt: "Google",
  },
  {
    icon: "/figmaAssets/social-icon---apple.svg",
    alt: "Apple",
  },
];

const passwordDots = Array(8).fill(null);

export const LogIn = (): JSX.Element => {
  return (
    <div className="bg-white w-full min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Hero Image (Hidden on mobile, shown on desktop) */}
      <section className="hidden lg:block lg:w-1/2 relative bg-[#f7f9f9]">
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
      <section className="w-full lg:w-1/2 bg-[#f7f9f9] flex items-center justify-center px-4 py-8 lg:py-0">
        <div className="w-full max-w-[447px] flex flex-col">
          {/* Mobile Header - Only show on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="[font-family:'Open_Sauce_Sans-ExtraBold',Helvetica] font-extrabold text-[#00856f] text-4xl mb-2">
              Diabetes 360
            </h1>
            <p className="[font-family:'Inter',Helvetica] text-gray-600">Welcome back</p>
          </div>

          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#00856f] text-3xl tracking-[-0.30px] leading-[39px] mb-8 lg:mb-[77px]">
            Log in
          </h2>

          <div className="flex flex-col gap-1.5 mb-[16px]">
            <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
              Email address
            </Label>
            <div className="flex w-full lg:w-[353px] items-center gap-2.5 px-4 py-[18px] bg-white rounded-[10px] border border-solid border-[#d8dadc]">
              <span className="flex-1 [font-family:'Inter',Helvetica] font-normal text-black text-base tracking-[0] leading-5">
                helloworld@gmail.com
              </span>
              <CheckIcon className="w-5 h-5 text-[#00856f]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-6 lg:mb-[38px]">
            <Label className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
              Password
            </Label>
            <div className="flex w-full lg:w-[353px] items-center gap-2.5 px-4 py-[18px] bg-white rounded-[10px] border border-solid border-[#d8dadc]">
              <div className="flex gap-1 flex-1">
                {passwordDots.map((_, index) => (
                  <div key={index} className="w-1.5 h-1.5 bg-black rounded-[3px]" />
                ))}
              </div>
              <EyeIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="flex justify-end w-full lg:w-[353px] mb-6 lg:mb-[38px]">
            <button className="[font-family:'Inter',Helvetica] font-normal text-black text-sm tracking-[0] leading-[17.5px]">
              Forgot password?
            </button>
          </div>

          <Button className="w-full lg:w-[353px] h-14 bg-[#00856f] hover:bg-[#00856f]/90 rounded-[10px] mb-[19px]">
            <span className="[font-family:'Inter',Helvetica] font-semibold text-white text-base tracking-[0] leading-5">
              Log in
            </span>
          </Button>

          <div className="flex items-center gap-[9px] w-full lg:w-[353px] mb-[22px]">
            <Separator className="flex-1 bg-[#d8dadc]" />
            <span className="[font-family:'Inter',Helvetica] font-normal text-[#000000b2] text-sm tracking-[0] leading-[17.5px]">
              Or Login with
            </span>
            <Separator className="flex-1 bg-[#d8dadc]" />
          </div>

          <div className="flex gap-[15px] mb-8 lg:mb-[117px] justify-center lg:justify-start">
            {socialButtons.map((social, index) => (
              <Button
                key={index}
                variant="outline"
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
              <button className="font-semibold text-black">Sign up</button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
