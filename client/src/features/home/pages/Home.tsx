import { ArrowRight, Users, Dumbbell, BookOpen, Bot, ScanLine } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';
import { Sidebar } from '@/components/layout/Sidebar';
import heroImage from '@assets/Main Homepage (Desktop)_1761070506278.png';

export function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Hero Section */}
          <Card className="mb-8 overflow-hidden border-none shadow-lg">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative h-64 md:h-auto">
                <img
                  src={heroImage}
                  alt="Diabetes care"
                  className="h-full w-full object-cover"
                  data-testid="img-hero"
                />
              </div>
              <div className="flex flex-col justify-center bg-gradient-to-br from-teal-50 to-teal-100 p-8 dark:from-teal-900/30 dark:to-teal-800/30">
                <p className="mb-2 text-sm font-medium text-teal-700 dark:text-teal-300" data-testid="text-hero-subtitle">
                  Going through the Stress of Diabetes.
                </p>
                <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl" data-testid="text-hero-title">
                  Try our Free <span className="text-teal-600 dark:text-teal-400">20 Minute</span> Consultation
                </h1>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 md:w-auto"
                  size="lg"
                  onClick={() => setLocation(ROUTES.INSTANT_CONSULTATION)}
                  data-testid="button-consult-now"
                >
                  Consult Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Clinically Backed Outcomes */}
          <div className="mb-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl" data-testid="text-outcomes-title">
              Clinically Backed Outcomes with <span className="text-teal-600 dark:text-teal-400">HealthSync</span>
            </h2>
            
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card className="border-2 border-gray-200 transition-shadow hover:shadow-lg dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <p className="mb-2 text-4xl font-bold text-teal-600 dark:text-teal-400" data-testid="text-stat-glucose">
                    12%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reduction in Average<br />
                    <span className="font-semibold">Blood Glucose</span> in 3 Months
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 transition-shadow hover:shadow-lg dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <p className="mb-2 text-4xl font-bold text-teal-600 dark:text-teal-400" data-testid="text-stat-hba1c">
                    0.5%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reduction in <span className="font-semibold">HbA1c</span><br />
                    in 3 Months
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200 transition-shadow hover:shadow-lg dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <p className="mb-2 text-4xl font-bold text-teal-600 dark:text-teal-400" data-testid="text-stat-hyperglycemic">
                    9.4%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drop in <span className="font-semibold">Hyperglycemic</span><br />
                    events in 3 Months
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-teal-600 px-8 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
                onClick={() => setLocation(ROUTES.DASHBOARD)}
                data-testid="button-join-program"
              >
                Join Our Care Program
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {/* Doctors */}
            <Card
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
              onClick={() => setLocation(ROUTES.FIND_DOCTOR)}
              data-testid="card-doctors"
            >
              <div className="relative">
                <div className="flex items-center justify-between bg-white p-4 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctors</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-24 w-24 text-blue-300 dark:text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tips & Exercises */}
            <Card
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
              onClick={() => setLocation(ROUTES.TIPS_EXERCISES)}
              data-testid="card-tips"
            >
              <div className="relative">
                <div className="flex items-center justify-between bg-white p-4 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tips & Exercises</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30">
                  <div className="flex h-full items-center justify-center">
                    <Dumbbell className="h-24 w-24 text-orange-300 dark:text-orange-600" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Health Blogs */}
            <Card
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
              onClick={() => setLocation(ROUTES.BLOGS)}
              data-testid="card-blogs"
            >
              <div className="relative">
                <div className="flex items-center justify-between bg-white p-4 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Blogs</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-24 w-24 text-green-300 dark:text-green-600" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Feature Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Meet DiaBot */}
            <Card
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
              onClick={() => setLocation(ROUTES.DIABOT)}
              data-testid="card-diabot"
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col justify-center p-6">
                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Meet DiaBot</h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      Your Friendly AI Health Companion
                    </p>
                    <Button
                      variant="outline"
                      className="w-fit"
                      onClick={() => setLocation(ROUTES.DIABOT)}
                      data-testid="button-meet-diabot"
                    >
                      Chat Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 dark:from-cyan-900/30 dark:to-cyan-800/30">
                    <Bot className="h-32 w-32 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Food Scanner */}
            <Card
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
              onClick={() => setLocation(ROUTES.FOOD_SCANNER)}
              data-testid="card-food-scanner"
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col justify-center p-6">
                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                      Scan Food to Make Healthier Choices
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try our Food Scanner to scan your food and see your glucose content
                    </p>
                  </div>
                  <div className="flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-6 dark:from-amber-900/30 dark:to-amber-800/30">
                    <ScanLine className="h-32 w-32 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
