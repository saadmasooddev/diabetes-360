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
import { Dashboard } from "@/features/dashboard/customer/pages/Dashboard";
import { HealthAssessment } from "@/features/dashboard/customer/pages/HealthAssessment";
import { HealthMetricsHistory } from "@/features/dashboard/customer/pages/HealthMetricsHistory";
import { InstantConsultation } from "@/features/dashboard/customer/pages/InstantConsultation";
import { FindDoctor } from "@/features/dashboard/customer/pages/FindDoctor";
import { Consultations } from "@/features/dashboard/customer/pages/Consultations";
import { FoodScanner } from "@/features/dashboard/customer/pages/FoodScanner";
import { TipsExercises } from "@/features/dashboard/customer/pages/TipsExercises";
import { MedicalRecords } from "@/features/dashboard/customer/pages/MedicalRecords";
import { Medications } from "@/features/dashboard/customer/pages/Medications";
import { HealthPlans } from "@/features/dashboard/customer/pages/HealthPlans";
import { Payments } from "@/features/dashboard/customer/pages/Payments";
import { ProfileData } from "@/features/dashboard/customer/pages/ProfileData";
import { Home } from "@/features/dashboard/customer/pages/Home";
import DiaBot from "@/features/dashboard/customer/pages/DiaBot";
import { Settings } from "@/pages/Settings";
import { ROUTES } from "@/config/routes";
import { StrengthTrainingProgress } from "./features/dashboard/customer/pages/StrengthTrainingProgress";
import { RecipeDetail } from "./features/dashboard/customer/pages/RecipeDetail";
import { DoctorPatients } from "./features/dashboard/doctor/DoctorPatients";
import { PatientProfile } from "./features/dashboard/doctor/PatientProfile";
import { DoctorHome } from "./features/dashboard/doctor/DoctorHome";
import { DoctorAppointments } from "./features/dashboard/doctor/DoctorAppointments";
import { PatientAlerts } from "./features/dashboard/doctor/PatientAlerts";
import { AuthRedirect } from "./components/auth/AuthRedirect";

function Router() {
  useAuthInit();

  return (
    <Switch>
      {/* Auth pages */}
      <Route path={ROUTES.LOGIN} >
        <AuthRedirect>
          <LogIn />
        </AuthRedirect>
      </Route>
      <Route path={ROUTES.SIGNUP} >
        <AuthRedirect>
          <SignUp />
        </AuthRedirect>
      </Route>
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
          <FoodScanner />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.TIPS_EXERCISES}>
        <ProtectedRoute>
          <TipsExercises />
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

      <Route path={ROUTES.DOCTOR_HOME} >
        <ProtectedRoute>
          <DoctorHome />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DOCTOR_PATIENT_PROFILE}  >
        <ProtectedRoute>
          <PatientProfile />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DOCTOR_PATIENTS} >
        <ProtectedRoute>
          <DoctorPatients />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DOCTOR_APPOINTMENTS} >
        <ProtectedRoute>
          <DoctorAppointments />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.DOCTOR_PATIENTS_ALERTS}  >
        <ProtectedRoute>
          <PatientAlerts />
        </ProtectedRoute>
      </Route>

      //admin routes

      <Route path={ROUTES.ADMIN_HOME} >
        <ProtectedRoute>
          <DoctorHome />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.ADMIN_PATIENT_PROFILE}  >
        <ProtectedRoute>
          <PatientProfile />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.ADMIN_PATIENTS} >
        <ProtectedRoute>
          <DoctorPatients />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.ADMIN_APPOINTMENTS} >
        <ProtectedRoute>
          <DoctorAppointments />
        </ProtectedRoute>
      </Route>
      <Route path={ROUTES.ADMIN_PATIENTS_ALERTS}  >
        <ProtectedRoute>
          <PatientAlerts />
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
