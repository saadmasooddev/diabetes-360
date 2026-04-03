import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { FcmForegroundListener } from "@/components/notifications/FcmForegroundListener";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthInit } from "@/hooks/useAuthInit";
import InvalidRoute from "@/pages/InvalidRoute";

import { LogIn } from "@/features/auth/pages/LogIn";
import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";
import { SignUp } from "@/features/auth/pages/SignUp";
import { VerifyEmail } from "@/features/auth/pages/VerifyEmail";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import { Dashboard } from "@/features/dashboard/customer/pages/Dashboard";
import { HealthAssessment } from "@/features/dashboard/customer/pages/HealthAssessment";
import { LogHistory } from "@/features/dashboard/customer/pages/LogHistory";
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
import { PERMISSIONS } from "@shared/schema";
import { MeetingLink } from "./components/common/MeetingLink";

function Router() {
	useAuthInit();

	return (
		<Switch>
			{/* Auth pages */}
			<Route path={ROUTES.LOGIN}>
				<AuthRedirect>
					<LogIn />
				</AuthRedirect>
			</Route>
			<Route path={ROUTES.SIGNUP}>
				<AuthRedirect>
					<SignUp />
				</AuthRedirect>
			</Route>
			<Route path={ROUTES.VERIFY_EMAIL}>
				<AuthRedirect>
					<VerifyEmail />
				</AuthRedirect>
			</Route>
			<Route path={ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
			<Route path={ROUTES.RESET_PASSWORD} component={ResetPassword} />
			{/* Protected routes */}
			<Route path={ROUTES.HOME}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_PROFILE]}>
					<Home />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.HEALTH_ASSESSMENT}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_HEALTH_METRICS]}>
					<HealthAssessment />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.HEALTH_METRICS_HISTORY}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_HEALTH_METRICS]}>
					<LogHistory />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DASHBOARD}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_HEALTH_METRICS]}>
					<Dashboard />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.INSTANT_CONSULTATION}>
				<ProtectedRoute permissions={[PERMISSIONS.CREATE_BOOKINGS]}>
					<InstantConsultation />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.FIND_DOCTOR}>
				<ProtectedRoute
					permissions={[
						PERMISSIONS.READ_PHYSICIANS,
						PERMISSIONS.CREATE_BOOKINGS,
					]}
				>
					<FindDoctor />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.CONSULTATIONS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_CONSULTATIONS]}>
					<Consultations />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.FOOD_SCANNER}>
				<ProtectedRoute permissions={[PERMISSIONS.SCAN_FOOD]}>
					<FoodScanner />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.TIPS_EXERCISES}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_HEALTH_METRICS]}>
					<TipsExercises />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.MEDICAL_RECORDS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_MEDICAL_RECORDS]}>
					<MedicalRecords />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.MEDICATIONS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_MEDICAL_RECORDS]}>
					<Medications />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DIABOT}>
				<ProtectedRoute permissions={[PERMISSIONS.USE_DIABOT]}>
					<DiaBot />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.HEALTH_PLANS}>
				<ProtectedRoute permissions={[PERMISSIONS.SUBSCRIBE_HEALTH_PLANS]}>
					<HealthPlans />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.PAYMENTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_BOOKINGS]}>
					<Payments />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.PROFILE_DATA}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_PROFILE]}>
					<ProfileData />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.SETTINGS}>
				<ProtectedRoute permissions={[PERMISSIONS.MANAGE_OWN_SETTINGS]}>
					<Settings />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.STRENGTH_TRAINING_PROGRESS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_HEALTH_METRICS]}>
					<StrengthTrainingProgress />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.RECIPE_DETAIL}>
				<ProtectedRoute permissions={[PERMISSIONS.VIEW_RECIPE]}>
					<RecipeDetail />
				</ProtectedRoute>
			</Route>
			// doctor routes
			<Route path={ROUTES.DOCTOR_HOME}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_APPOINTMENTS]}>
					<DoctorHome />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DOCTOR_PATIENT_PROFILE}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_PATIENT_PROFILES]}>
					<PatientProfile />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DOCTOR_PATIENTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_PATIENT_PROFILES]}>
					<DoctorPatients />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DOCTOR_APPOINTMENTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_OWN_APPOINTMENTS]}>
					<DoctorAppointments />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.DOCTOR_PATIENTS_ALERTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_PATIENT_ALERTS]}>
					<PatientAlerts />
				</ProtectedRoute>
			</Route>
			//admin routes
			<Route path={ROUTES.ADMIN_HOME}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_ALL_APPOINTMENTS]}>
					<DoctorHome />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.ADMIN_PATIENT_PROFILE}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_PATIENT_PROFILES]}>
					<PatientProfile />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.ADMIN_PATIENTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_ALL_PATIENTS]}>
					<DoctorPatients />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.ADMIN_APPOINTMENTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_ALL_APPOINTMENTS]}>
					<DoctorAppointments />
				</ProtectedRoute>
			</Route>
			<Route path={ROUTES.ADMIN_PATIENTS_ALERTS}>
				<ProtectedRoute permissions={[PERMISSIONS.READ_PATIENT_ALERTS]}>
					<PatientAlerts />
				</ProtectedRoute>
			</Route>

			// common routes
			<Route path={ROUTES.MEETING_LINK}>
				<ProtectedRoute permissions={[PERMISSIONS.VIEW_MEETING_LINK]}>
					<MeetingLink />
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
				<FcmForegroundListener />
				<Router />
			</TooltipProvider>
		</QueryClientProvider>
	);
}

export default App;
