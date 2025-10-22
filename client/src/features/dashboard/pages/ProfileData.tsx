import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { profileDataSchema, type ProfileDataFormValues } from '@/schemas/profileData';
import {
  genderOptions,
  diabetesTypeOptions,
  dayOptions,
  monthOptions,
  yearOptions,
  weightOptions,
  heightOptions,
} from '@/mocks/profileData';
import { ROUTES } from '@/config/routes';
import { useToast } from '@/hooks/use-toast';

export function ProfileData() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProfileDataFormValues>({
    resolver: zodResolver(profileDataSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: undefined,
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      diagnosisDay: '',
      diagnosisMonth: '',
      diagnosisYear: '',
      weight: '',
      height: '',
      diabetesType: undefined,
    },
  });

  const onSubmit = (data: ProfileDataFormValues) => {
    console.log('Profile data submitted:', data);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved successfully.',
    });
    setLocation(ROUTES.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      {/* Left Sidebar */}
      <div
        className="w-[309px] flex items-center justify-center px-8"
        style={{ background: '#00856F' }}
      >
        <h1
          className="text-white font-bold leading-[130%] tracking-[-0.01em]"
          style={{
            fontFamily: "'Open Sauce Sans', sans-serif",
            fontSize: '48px',
          }}
          data-testid="text-sidebar-heading"
        >
          Help our App understand you!
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-16 py-12">
        <div className="max-w-[762px] mx-auto">
          {/* Page Title */}
          <h1
            className="font-bold leading-[130%] tracking-[-0.01em] mb-12"
            style={{
              fontFamily: "'Open Sauce Sans', sans-serif",
              fontSize: '48px',
              color: '#00856F',
            }}
            data-testid="text-page-heading"
          >
            Tell Us about Yourself
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              {/* Personal Details Section */}
              <div>
                <h2
                  className="font-bold leading-[130%] tracking-[-0.01em] mb-8"
                  style={{
                    fontFamily: "'Open Sauce Sans', sans-serif",
                    fontSize: '32px',
                    color: '#00856F',
                  }}
                  data-testid="text-personal-details"
                >
                  Personal Details
                </h2>

                <div className="space-y-6">
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="text-[20px] font-normal"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First Name"
                              {...field}
                              className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="text-[20px] font-normal"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Last Name"
                              {...field}
                              className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Gender and Date of Birth Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="text-[20px] font-normal"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Gender
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                data-testid="select-gender"
                              >
                                <SelectValue placeholder="Male/Female" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {genderOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  data-testid={`option-gender-${option.value}`}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel
                        className="text-[20px] font-normal block mb-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Date of Birth
                      </FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="birthDay"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-birth-day"
                                  >
                                    <SelectValue placeholder="DD" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dayOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-birth-day-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birthMonth"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-birth-month"
                                  >
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {monthOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-birth-month-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birthYear"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-birth-year"
                                  >
                                    <SelectValue placeholder="YYYY" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yearOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-birth-year-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Section */}
              <div>
                <h2
                  className="font-bold leading-[130%] tracking-[-0.01em] mb-8"
                  style={{
                    fontFamily: "'Open Sauce Sans', sans-serif",
                    fontSize: '32px',
                    color: '#00856F',
                  }}
                  data-testid="text-diagnosis"
                >
                  Diagnosis
                </h2>

                <div className="space-y-6">
                  {/* Diagnosis Date Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FormLabel
                        className="text-[20px] font-normal block mb-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Diagnosis Date
                      </FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="diagnosisDay"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-diagnosis-day"
                                  >
                                    <SelectValue placeholder="DD" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {dayOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-diagnosis-day-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="diagnosisMonth"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-diagnosis-month"
                                  >
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {monthOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-diagnosis-month-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="diagnosisYear"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    data-testid="select-diagnosis-year"
                                  >
                                    <SelectValue placeholder="YYYY" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yearOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      data-testid={`option-diagnosis-year-${option.value}`}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Weight and Height */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className="text-[20px] font-normal"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              Weight(kg)
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                  data-testid="select-weight"
                                >
                                  <SelectValue placeholder="0" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {weightOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    data-testid={`option-weight-${option.value}`}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className="text-[20px] font-normal"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              Height(cm)
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  className="h-[46px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                  data-testid="select-height"
                                >
                                  <SelectValue placeholder="0" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {heightOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    data-testid={`option-height-${option.value}`}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Type of Diabetes */}
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="diabetesType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="text-[20px] font-normal"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Type of Diabetes
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="h-[56px] rounded-[10px] border-[#D8DADC] text-[16px]"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                data-testid="select-diabetes-type"
                              >
                                <SelectValue placeholder="Type 1 Diabetes" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {diabetesTypeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  data-testid={`option-diabetes-${option.value}`}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-[56px] rounded-[10px] text-white text-[18px] font-semibold"
                style={{
                  background: '#00856F',
                  fontFamily: "'Inter', sans-serif",
                }}
                data-testid="button-submit-details"
              >
                Submit Details
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
