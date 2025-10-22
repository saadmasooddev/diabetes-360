import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LogIn } from "@/features/auth/pages/LogIn";
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";
import { SignUp } from "@/features/auth/pages/SignUp";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { HealthAssessment } from "@/features/dashboard/pages/HealthAssessment";
import { InstantConsultation } from "@/features/dashboard/pages/InstantConsultation";
import { FindDoctor } from "@/features/dashboard/pages/FindDoctor";
import { FoodScanner } from "@/features/dashboard/pages/FoodScanner";
import { TipsExercises } from "@/features/dashboard/pages/TipsExercises";
import { MedicalRecords } from "@/features/dashboard/pages/MedicalRecords";
import { MetricsHistory } from "@/features/metrics/pages/MetricsHistory";
import { Home } from "@/features/home/pages/Home";
import { Blogs } from "@/pages/Blogs";
import DiaBot from "@/features/dashboard/pages/DiaBot";
import { Settings } from "@/pages/Settings";
import { ROUTES } from "@/config/routes";

function Router() {
  return (
    <Switch>
      {/* Auth pages */}
      <Route path={ROUTES.LOGIN} component={LogIn} />
      <Route path={ROUTES.SIGNUP} component={SignUp} />
      <Route path={ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      {/* Main App */}
      <Route path={ROUTES.HOME} component={Home} />
      <Route path={ROUTES.HEALTH_ASSESSMENT} component={HealthAssessment} />
      <Route path={ROUTES.DASHBOARD} component={Dashboard} />
      <Route path={ROUTES.METRICS_HISTORY} component={MetricsHistory} />
      {/* Feature Pages */}
      <Route path={ROUTES.INSTANT_CONSULTATION} component={InstantConsultation} />
      <Route path={ROUTES.FIND_DOCTOR} component={FindDoctor} />
      <Route path={ROUTES.FOOD_SCANNER} component={FoodScanner} />
      <Route path={ROUTES.TIPS_EXERCISES}>
        {() => <TipsExercises isPremium={false} />}
      </Route>
      <Route path={ROUTES.MEDICAL_RECORDS}>
        {() => <MedicalRecords isPremium={false} />}
      </Route>
      <Route path={ROUTES.DIABOT} component={DiaBot} />
      <Route path={ROUTES.BLOGS} component={Blogs} />
      <Route path={ROUTES.SETTINGS} component={Settings} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
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
