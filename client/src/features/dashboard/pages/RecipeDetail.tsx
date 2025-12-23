import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRecipeDetails } from "@/hooks/mutations/useRecipeDetails";
import type { MealDetails } from "@/services/foodScannerService";
import healthyFoodImg from "@assets/55ff7c0e103d474de22c65ec97f5ff150c7ef2af_1761129643122.jpg";

type NavigationMealState = {
  meal?: MealDetails;
  mealType?: string;
};

export function RecipeDetail() {
  const [, setLocation] = useLocation();
  const { mutate, data, isPending } = useRecipeDetails();

  const navigationState = {
    meal: history.state.meal,
    mealType: history.state.mealType
  }
  const mealFromState = navigationState?.meal;
  const mealTypeFromState = navigationState?.mealType;

  useEffect(() => {
    if (!mealFromState || !mealTypeFromState) return;
    mutate({
      name: mealFromState.name,
      mealType: mealTypeFromState,
      nutrition_info: mealFromState.nutrition_info,
    });
  }, [mutate, mealFromState, mealTypeFromState]);

  const recipeTitle = data?.title
  const recipeDescription = data?.description
  const ingredients = data?.ingredients || []

  const recipeIngredients =
    ingredients.map((section) => {
      if (section.main_ingredients || section.sub_ingredients) {
        return {
          heading: section.main_ingredients?.heading || "Ingredients",
          items: section.main_ingredients?.items || [],
          sub_ingredients: section.sub_ingredients,
        };
      }
      return section;
    })

  const recipeSteps = data?.making_steps || [];
  const shouldShowUnavailable = !mealFromState || !mealTypeFromState;

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-[1135px] px-4 py-8 lg:px-10 lg:py-10">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setLocation(ROUTES.HOME)}
              className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100"
              style={{ color: "#212529" }}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
            <h1
              className="text-xl font-bold lg:text-2xl"
              style={{ color: "#212529" }}
            >
              Recipe
            </h1>
          </div>

          {shouldShowUnavailable ? (
            <Card
              className="p-6"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EAEAEA",
                borderRadius: "10px",
              }}
            >
              <p className="text-sm md:text-base" style={{ color: "#546E7A" }}>
                No meal selected. Please return to Home and pick a meal to view its recipe.
              </p>
              <div className="mt-4">
                <button
                  className="rounded-md px-4 py-2 text-sm font-semibold"
                  style={{ background: "#00856F", color: "#FFFFFF" }}
                  onClick={() => setLocation(ROUTES.HOME)}
                >
                  Go back
                </button>
              </div>
            </Card>
          ) : (
            <Card
              className="overflow-hidden"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EAEAEA",
                borderRadius: "10px",
              }}
            >
              <div className="relative h-64 w-full md:h-80 lg:h-96">
                <Image
                  src={healthyFoodImg}
                  alt={mealFromState?.name || "Recipe"}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4 md:p-6 lg:p-8">
                <h2
                  className="mb-3 text-2xl font-bold md:text-3xl lg:text-4xl"
                  style={{ color: "#00856F" }}
                >
                  {recipeTitle}
                </h2>

                {isPending ? (
                  <Skeleton className="mb-6 h-20 w-full rounded-md" />
                ) : (
                  <p
                    className="mb-6 text-sm leading-relaxed md:text-base lg:text-lg"
                    style={{ color: "#546E7A" }}
                  >
                    {recipeDescription || "We are generating a personalized recipe based on your meal."}
                  </p>
                )}

                <div>
                  <h3
                    className="mb-4 text-lg font-bold md:text-xl lg:text-2xl"
                    style={{ color: "#00856F" }}
                  >
                    Ingredients
                  </h3>

                  {isPending ? (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-48 rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-5/6 rounded-md" />
                      <Skeleton className="h-4 w-3/4 rounded-md" />
                    </div>
                  ) : (
                    recipeIngredients.map((section: any, idx: number) => (
                      <div key={idx} className="mb-6">
                        <h4
                          className="mb-3 text-base font-semibold md:text-lg lg:text-xl"
                          style={{ color: "#212529" }}
                        >
                          {section.heading || "Ingredients"}
                        </h4>
                        <ul className="ml-4 space-y-2 md:space-y-3">
                          {(section.items || []).map((item: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm leading-relaxed md:text-base lg:text-lg"
                              style={{ color: "#546E7A" }}
                            >
                              • {item}
                            </li>
                          ))}
                        </ul>
                        {section.sub_ingredients && (
                          <div className="mt-4">
                            <h5
                              className="mb-3 text-base font-semibold md:text-lg lg:text-xl"
                              style={{ color: "#212529" }}
                            >
                              {section.sub_ingredients.heading || "Seasonings"}
                            </h5>
                            <ul className="ml-4 space-y-2 md:space-y-3">
                              {(section.sub_ingredients.items || []).map((item: string, index: number) => (
                                <li
                                  key={index}
                                  className="text-sm leading-relaxed md:text-base lg:text-lg"
                                  style={{ color: "#546E7A" }}
                                >
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <div className="mt-4">
                    <h3
                      className="mb-3 text-lg font-bold md:text-xl lg:text-2xl"
                      style={{ color: "#00856F" }}
                    >
                      Steps
                    </h3>
                    {isPending ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-11/12 rounded-md" />
                        <Skeleton className="h-4 w-10/12 rounded-md" />
                      </div>
                    ) : (
                      <ol className="ml-4 space-y-3 md:space-y-4 list-decimal">
                        {recipeSteps.map((step: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm leading-relaxed md:text-base lg:text-lg"
                            style={{ color: "#546E7A" }}
                          >
                            {step}
                          </li>
                        ))}
                        {recipeSteps.length === 0 && (
                          <li
                            className="text-sm leading-relaxed md:text-base lg:text-lg"
                            style={{ color: "#546E7A" }}
                          >
                            Recipe steps are not available right now.
                          </li>
                        )}
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

