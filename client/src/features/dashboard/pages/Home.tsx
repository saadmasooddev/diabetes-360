import { ArrowRight, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useUserDailyData } from "@/hooks/mutations/useFoodScanner";
import diabetesTestingImg from "@assets/5aaf99d1f9b3c79c814d4956017fda1dfea783e6_1761129643123.jpg";
import doctorImg from "@assets/f74b7c32a8d920183ab34367c07cd6efa5afb4cc_1761129643123.png";
import exerciseImg from "@assets/998dd4468701cfe07ad82ef7315ec5abee1cf1c6_1761129643123.jpg";
import healthyFoodImg from "@assets/55ff7c0e103d474de22c65ec97f5ff150c7ef2af_1761129643122.jpg";
import diaBotImg from "@assets/ChatGPT Image Jul 28, 2025, 11_00_42 PM 1_1761129643124.png";
import foodScannerImg from "@assets/750x750bb 2_1761129643123.png";
import { FoodSuggestion, MealDetails } from "@/services/foodScannerService";
import { MEAL_TYPE_ENUM } from "@shared/schema";


export function Home() {
  const [, setLocation] = useLocation();
  const user = useAuthStore((state) => state.user);
  const isPaidUser = user?.paymentType !== 'free' && user?.paymentType;
  const { toast } = useToast();

  const { data: userDailyData, isLoading: isLoadingUserDailyData } = useUserDailyData();

  const foodSuggestions = userDailyData?.foodSuggestions || []
  const personalInsights = userDailyData?.foodInsights || []

  function randomIndex(array: unknown[]) {
    return Math.floor(Math.random() * array.length);
  }

  type MealTypeValue = (typeof MEAL_TYPE_ENUM)[keyof typeof MEAL_TYPE_ENUM];

  function getCurrentMealBasedOnTimeOfDay(fs: FoodSuggestion[]): { meal: MealDetails; mealType: MealTypeValue } | undefined {
    const currentTime = new Date().getHours();
    let array: MealDetails[] | undefined = []
    let mealType: MealTypeValue | undefined;
    if (currentTime >= 6 && currentTime < 11) {
      mealType = MEAL_TYPE_ENUM.Breakfast;
      array = fs.find(meal => meal.mealType === MEAL_TYPE_ENUM.Breakfast)?.meals;
    } else if (currentTime >= 11 && currentTime < 17) {
      mealType = MEAL_TYPE_ENUM.Lunch;
      array = fs.find(meal => meal.mealType === MEAL_TYPE_ENUM.Lunch)?.meals;
    } else {
      mealType = MEAL_TYPE_ENUM.Dinner;
      array = fs.find(meal => meal.mealType === MEAL_TYPE_ENUM.Dinner)?.meals;
    }

    if (!array) return undefined
    return {
      meal: array[randomIndex(array)],
      mealType: mealType as MealTypeValue,
    }
  }

  const currentMeal = getCurrentMealBasedOnTimeOfDay(foodSuggestions);

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-[1135px] px-4 py-8 lg:px-10 lg:py-10">
          {/* Greeting Section - Paid Users Only */}
          {isPaidUser && user && (
            <div className="mb-6">
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ color: "#212529" }}
                data-testid="text-greeting"
              >
                Hello, <span style={{ color: "#00856F" }}>{user.firstName}!</span>
              </h1>
            </div>
          )}

          {/* Hero Section */}
          {!isPaidUser && (
            <Card
              className="mb-8 overflow-hidden border-none shadow-lg"
              style={{ background: "#DCE9E2", borderRadius: "5px" }}
              data-testid="card-hero"
            >
              <div className="grid gap-0 md:grid-cols-[503px_1fr]">
                <div
                  className="relative h-64 md:h-60"
                  style={{ background: "#00453A" }}
                >
                  <Image
                    src={diabetesTestingImg}
                    alt="Diabetes care"
                    className="h-full w-full object-cover"
                    style={{ borderRadius: "5px 0 0 5px" }}
                    data-testid="img-hero"
                  />
                </div>
                <div className="flex flex-col justify-center px-8 py-8 md:px-12">
                  <p
                    className="mb-3 text-base font-bold leading-tight"
                    style={{ color: "#00856F" }}
                    data-testid="text-hero-subtitle"
                  >
                    Going through the Stress of Diabetes.
                  </p>
                  <h1
                    className="mb-6 text-3xl font-extrabold leading-tight md:text-[32px]"
                    style={{ color: "#00453A" }}
                    data-testid="text-hero-title"
                  >
                    Try our Free 20 Minute Consultation
                  </h1>
                  <Button
                    className="w-full md:w-auto"
                    style={{
                      background: "#00856F",
                      color: "#FFFFFF",
                      borderRadius: "5px",
                      padding: "9px 48px",
                      fontSize: "16px",
                      fontWeight: 700,
                      height: "48px",
                    }}
                    onClick={() => setLocation(ROUTES.INSTANT_CONSULTATION)}
                    data-testid="button-consult-now"
                  >
                    Consult Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}


          {/* Paid User Sections */}
          {isPaidUser && (
            <>
              {/* Personalized Meal Plans Section */}
              <div className="mb-8">
                <h2
                  className="mb-4 text-xl font-bold md:text-2xl"
                  style={{ color: "#00856F" }}
                  data-testid="text-meal-plans-title"
                >
                  Personalized Meal Plans for You
                </h2>

                {isLoadingUserDailyData ? (
                  <Card
                    className="p-4 md:p-6"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #EAEAEA",
                      borderRadius: "10px",
                    }}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      <Skeleton className="h-32 w-full md:w-48 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-48" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : currentMeal ? (
                  <Card
                    className="overflow-hidden"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #EAEAEA",
                      borderRadius: "10px",
                    }}
                    data-testid="card-meal-plan"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-48 md:h-auto md:w-48 flex-shrink-0">
                        <Image
                          src={healthyFoodImg}
                          alt={currentMeal.meal.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                        <div>
                          <p
                            className="mb-2 text-sm"
                            style={{ color: "#546E7A" }}
                          >
                            {currentMeal.mealType}
                          </p>
                          <h3
                            className="mb-4 text-lg font-bold md:text-xl"
                            style={{ color: "#00856F" }}
                          >
                            {currentMeal.meal.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span
                              className="px-3 py-1 rounded-md text-xs font-medium"
                              style={{
                                background: "#DCE9E2",
                                color: "#00856F",
                              }}
                            >
                              Carbs: {parseFloat(currentMeal.meal.nutrition_info.carbs.toString()).toFixed(0)}g
                            </span>
                            <span
                              className="px-3 py-1 rounded-md text-xs font-medium"
                              style={{
                                background: "#DCE9E2",
                                color: "#00856F",
                              }}
                            >
                              Calories: {parseFloat(currentMeal.meal.nutrition_info.calories.toString()).toFixed(0)}
                            </span>
                            <span
                              className="px-3 py-1 rounded-md text-xs font-medium"
                              style={{
                                background: "#DCE9E2",
                                color: "#00856F",
                              }}
                            >
                              Proteins: {parseFloat(currentMeal.meal.nutrition_info.proteins.toString()).toFixed(0)}g
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full md:w-auto md:ml-auto"
                          style={{
                            background: "#00856F",
                            color: "#FFFFFF",
                            borderRadius: "5px",
                            padding: "8px 24px",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            if (currentMeal) {
                              setLocation(ROUTES.RECIPE_DETAIL, {
                                state: {
                                  meal: currentMeal.meal,
                                  mealType: currentMeal.mealType,
                                },
                              });
                            }
                          }}
                          data-testid="button-view-recipe"
                        >
                          View Recipe
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>

              {/* Weekly Half Hour Consultation Banner */}
              <Card
                className="mb-8 overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                style={{
                  background: "#00856F",
                  borderRadius: "10px",
                }}
                onClick={() => setLocation(ROUTES.CONSULTATIONS)}
                data-testid="card-weekly-consultation"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6">
                  <h3
                    className="mb-3 sm:mb-0 text-lg md:text-xl font-semibold text-white"
                  >
                    Weekly Half Hour Consultation
                  </h3>
                  <Button
                    style={{
                      background: "#FFFFFF",
                      color: "#00856F",
                      borderRadius: "5px",
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(ROUTES.CONSULTATIONS);
                    }}
                    data-testid="button-book-consultation"
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Clinically Backed Outcomes */}
          {!isPaidUser && (
            <div className="mb-8">
              <h2
                className="mb-8 text-center text-3xl font-bold leading-10"
                style={{ color: "#212529" }}
                data-testid="text-outcomes-title"
              >
                Clinically Backed Outcomes with{" "}
                <span style={{ color: "#00856F" }}>HealthSync</span>
              </h2>

              <div className="mb-8 grid gap-6 md:grid-cols-3">
                {/* Stat Card 1 */}
                <Card
                  className="p-5 text-center"
                  style={{
                    background: "#FFFAF1",
                    border: "0.5px solid #00856F",
                    borderRadius: "5px",
                  }}
                  data-testid="card-stat-glucose"
                >
                  <p
                    className="mb-2 text-4xl font-bold"
                    style={{
                      color: "#00856F",
                      fontSize: "36px",
                      lineHeight: "130%",
                    }}
                    data-testid="text-stat-glucose"
                  >
                    12%
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "150%",
                    }}
                  >
                    Reduction in Average Blood Glucose in 3 Months
                  </p>
                </Card>

                {/* Stat Card 2 */}
                <Card
                  className="p-5 text-center"
                  style={{
                    background: "#FFFAF1",
                    border: "0.5px solid #00856F",
                    borderRadius: "5px",
                  }}
                  data-testid="card-stat-hba1c"
                >
                  <p
                    className="mb-2 text-4xl font-bold"
                    style={{
                      color: "#00856F",
                      fontSize: "36px",
                      lineHeight: "130%",
                    }}
                    data-testid="text-stat-hba1c"
                  >
                    0.5%
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "150%",
                    }}
                  >
                    Reduction in HbA1c in 3 Months
                  </p>
                </Card>

                {/* Stat Card 3 */}
                <Card
                  className="p-5 text-center"
                  style={{
                    background: "#FFFAF1",
                    border: "0.5px solid #00856F",
                    borderRadius: "5px",
                  }}
                  data-testid="card-stat-hyperglycemic"
                >
                  <p
                    className="mb-2 text-4xl font-bold"
                    style={{
                      color: "#00856F",
                      fontSize: "36px",
                      lineHeight: "130%",
                    }}
                    data-testid="text-stat-hyperglycemic"
                  >
                    9.4%
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "#000000",
                      fontSize: "12px",
                      lineHeight: "150%",
                    }}
                  >
                    Drop in Hyperglycemic events in 3 Months
                  </p>
                </Card>
              </div>

              <div className="mb-10 flex justify-center">
                <Button
                  style={{
                    background: "#00856F",
                    color: "#FFFFFF",
                    borderRadius: "5px",
                    padding: "18px 16px",
                    fontSize: "16px",
                    fontWeight: 700,
                    height: "63px",
                    minWidth: "406px",
                  }}
                  onClick={() => setLocation(ROUTES.DASHBOARD)}
                  data-testid="button-join-program"
                >
                  Join Our Care Program
                </Button>
              </div>
            </div>
          )}


          {/* Feature Cards */}
          {!isPaidUser && (
            <div className="mb-10 grid gap-6 md:grid-cols-3">
              {/* Doctors */}
              <Card
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EAEAEA",
                  borderRadius: "10px",
                }}
                onClick={() => setLocation(ROUTES.FIND_DOCTOR)}
                data-testid="card-doctors"
              >
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        color: "#00453A",
                        fontSize: "18px",
                        fontWeight: 600,
                      }}
                    >
                      Doctors
                    </h3>
                    <div
                      className="flex h-10 w-10 items-center justify-center"
                      style={{
                        background: "#00856F",
                        borderRadius: "50%",
                        transform: "rotate(-45deg)",
                      }}
                    >
                      <ArrowRight
                        className="h-4 w-4"
                        style={{ color: "#F7F9F9" }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="h-28 overflow-hidden"
                  style={{ borderRadius: "0 0 10px 10px" }}
                >
                  <Image
                    src={doctorImg}
                    alt="Doctors"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Card>

              {/* Tips & Exercises */}
              <Card
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EAEAEA",
                  borderRadius: "10px",
                }}
                onClick={() => setLocation(ROUTES.TIPS_EXERCISES)}
                data-testid="card-tips"
              >
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        color: "#00453A",
                        fontSize: "18px",
                        fontWeight: 600,
                      }}
                    >
                      Tips & Exercises
                    </h3>
                    <div
                      className="flex h-10 w-10 items-center justify-center"
                      style={{
                        background: "#00856F",
                        borderRadius: "50%",
                        transform: "rotate(-45deg)",
                      }}
                    >
                      <ArrowRight
                        className="h-4 w-4"
                        style={{ color: "#F7F9F9" }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="h-28 overflow-hidden"
                  style={{ borderRadius: "0 0 10px 10px" }}
                >
                  <Image
                    src={exerciseImg}
                    alt="Tips & Exercises"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </Card>

              {/* Health Blogs */}
              <Card
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EAEAEA",
                  borderRadius: "10px",
                }}
                onClick={() => setLocation(ROUTES.BLOGS)}
                data-testid="card-blogs"
              >
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        color: "#00453A",
                        fontSize: "18px",
                        fontWeight: 600,
                      }}
                    >
                      Health Blogs
                    </h3>
                    <div
                      className="flex h-10 w-10 items-center justify-center"
                      style={{
                        background: "#00856F",
                        borderRadius: "50%",
                        transform: "rotate(-45deg)",
                      }}
                    >
                      <ArrowRight
                        className="h-4 w-4"
                        style={{ color: "#F7F9F9" }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="h-28 overflow-hidden"
                  style={{ borderRadius: "0 0 10px 10px" }}
                >
                  <Image
                    src={healthyFoodImg}
                    alt="Health Blogs"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              </Card>
            </div>
          )}


          {/* Personal Insights Section - Paid Users Only */}
          {isPaidUser && (
            <div className="mb-10">
              <h2
                className="mb-4 text-xl font-bold md:text-2xl"
                style={{ color: "#00856F" }}
                data-testid="text-insights-title"
              >
                Personal Insights for You
              </h2>

              {isLoadingUserDailyData ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      className="p-4"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #EAEAEA",
                        borderRadius: "10px",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : personalInsights && personalInsights.length > 0 ? (
                <div className="space-y-3">
                  {personalInsights.map((insight) => (
                    <Card
                      key={insight.id}
                      className="p-4"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #EAEAEA",
                        borderRadius: "10px",
                      }}
                      data-testid={`card-insight-${insight.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <Heart
                          className="h-5 w-5 flex-shrink-0 mt-0.5"
                          style={{ color: "#DCE9E2" }}
                          fill="#DCE9E2"
                        />
                        <p
                          className="text-sm md:text-base"
                          style={{ color: "#212529" }}
                        >
                          {insight.insightText}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {!isPaidUser && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Meet DiaBot */}
              <Card
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  height: "172px",
                }}
                onClick={() => setLocation(ROUTES.DIABOT)}
                data-testid="card-diabot"
              >
                <div className="relative flex h-full items-center gap-0">
                  <div
                    className="flex h-full flex-1 flex-col justify-center px-6 py-4"
                    style={{ background: "#DCE9E2" }}
                  >
                    <h3
                      className="mb-1 text-xl font-bold"
                      style={{
                        color: "#00453A",
                        fontSize: "20px",
                        lineHeight: "1.2",
                        fontWeight: 700,
                      }}
                    >
                      Meet DiaBot
                    </h3>
                    <p
                      className="mb-3 text-sm"
                      style={{
                        color: "#00856F",
                        fontSize: "13px",
                        lineHeight: "1.3",
                        fontWeight: 500,
                      }}
                    >
                      Your Friendly AI Health Companion
                    </p>
                    <Button
                      style={{
                        background: "#00856F",
                        color: "#FFFFFF",
                        borderRadius: "5px",
                        padding: "8px 20px",
                        fontSize: "12px",
                        fontWeight: 700,
                        width: "fit-content",
                        height: "auto",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(ROUTES.DIABOT);
                      }}
                      data-testid="button-chat-diabot"
                    >
                      Chat Now
                    </Button>
                  </div>
                  <div
                    className="flex h-full items-center justify-center px-6"
                    style={{ background: "#DCE9E2" }}
                  >
                    <Image
                      src={diaBotImg}
                      alt="DiaBot AI"
                      className="h-32 w-auto object-contain"
                      style={{
                        filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))",
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Food Scanner */}
              <Card
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                style={{
                  background: "#FFFFFF",
                  height: "172px",
                }}
                onClick={() => setLocation(ROUTES.FOOD_SCANNER)}
                data-testid="card-food-scanner"
              >
                <div className="relative flex h-full items-center gap-0">
                  <div
                    className="flex h-full flex-1 flex-col justify-center px-6 py-4"
                    style={{ background: "#DCE9E2" }}
                  >
                    <h3
                      className="mb-1 text-lg font-bold leading-tight"
                      style={{
                        color: "#00453A",
                        fontSize: "18px",
                        lineHeight: "1.2",
                        fontWeight: 700,
                      }}
                    >
                      Scan Food to Make Healthier Choices
                    </h3>
                    <p
                      className="text-xs"
                      style={{
                        color: "#546E7A",
                        fontSize: "12px",
                        lineHeight: "1.4",
                        fontWeight: 400,
                      }}
                    >
                      Try our Food Scanner
                    </p>
                  </div>
                  <div
                    className="flex h-full items-center justify-center px-4"
                    style={{ background: "#DCE9E2" }}
                  >
                    <Image
                      src={foodScannerImg}
                      alt="Food Scanner App"
                      className="h-40 w-auto object-contain"
                      style={{
                        filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))",
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Bottom Section - DiaBot and Food Scanner */}

        </div>
      </main>
    </div>
  );
}
