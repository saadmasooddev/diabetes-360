import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthInit } from "@/hooks/useAuthInit";
import InvalidRoute from "@/pages/InvalidRoute";

import { LogIn } from "@/features/auth/pages/LogIn";
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";
import { SignUp } from "@/features/auth/pages/SignUp";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { HealthAssessment } from "@/features/dashboard/pages/HealthAssessment";
import { HealthMetricsHistory } from "@/features/dashboard/pages/HealthMetricsHistory";
import { InstantConsultation } from "@/features/dashboard/pages/InstantConsultation";
import { FindDoctor } from "@/features/dashboard/pages/FindDoctor";
import { Consultations } from "@/features/dashboard/pages/Consultations";
import { FoodScanner } from "@/features/dashboard/pages/FoodScanner";
import { TipsExercises } from "@/features/dashboard/pages/TipsExercises";
import { MedicalRecords } from "@/features/dashboard/pages/MedicalRecords";
import { Medications } from "@/features/dashboard/pages/Medications";
import { HealthPlans } from "@/features/dashboard/pages/HealthPlans";
import { Payments } from "@/features/dashboard/pages/Payments";
import { ProfileData } from "@/features/dashboard/pages/ProfileData";
import { Home } from "@/features/dashboard/pages/Home";
import DiaBot from "@/features/dashboard/pages/DiaBot";
import { Settings } from "@/pages/Settings";
import { ROUTES } from "@/config/routes";
import { StrengthTrainingProgress } from "./features/dashboard/pages/StrengthTrainingProgress";
import { RecipeDetail } from "./features/dashboard/pages/RecipeDetail";

function Router() {
  useAuthInit();

  return (
    <Switch>
      {/* Auth pages */}
      <Route path={ROUTES.LOGIN} component={LogIn} />
      <Route path={ROUTES.SIGNUP} component={SignUp} />
      <Route path={ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      <Route path={ROUTES.RESET_PASSWORD} component={ResetPassword} />

      {/* Protected routes */}
      <Route path={ROUTES.HOME}>
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.HEALTH_ASSESSMENT}>
        <ProtectedRoute>
          <HealthAssessment />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.HEALTH_METRICS_HISTORY}>
        <ProtectedRoute>
          <HealthMetricsHistory />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DASHBOARD}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.INSTANT_CONSULTATION}>
        <ProtectedRoute>
          <InstantConsultation />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.FIND_DOCTOR}>
        <ProtectedRoute>
          <FindDoctor />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.CONSULTATIONS}>
        <ProtectedRoute>
          <Consultations />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.FOOD_SCANNER}>
        <ProtectedRoute>
          <FoodScanner isPremium={false} />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.TIPS_EXERCISES}>
        <ProtectedRoute>
          <TipsExercises isPremium={false} />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.MEDICAL_RECORDS}>
        <ProtectedRoute>
          <MedicalRecords />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.MEDICATIONS}>
        <ProtectedRoute>
          <Medications />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DIABOT}>
        <ProtectedRoute>
          <DiaBot />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.HEALTH_PLANS}>
        <ProtectedRoute>
          <HealthPlans />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.PAYMENTS}>
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.PROFILE_DATA}>
        <ProtectedRoute>
          <ProfileData />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.SETTINGS}>
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.STRENGTH_TRAINING_PROGRESS}>
        <ProtectedRoute>
          <StrengthTrainingProgress />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.RECIPE_DETAIL}>
        <ProtectedRoute>
          <RecipeDetail />
        </ProtectedRoute>
      </Route>

      {/* Fallback for invalid routes */}
      <Route component={InvalidRoute} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
