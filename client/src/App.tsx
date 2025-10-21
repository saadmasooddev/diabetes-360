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
import { ROUTES } from "@/config/routes";

function Router() {
  return (
    <Switch>
      {/* Auth pages */}
      <Route path={ROUTES.LOGIN} component={LogIn} />
      <Route path={ROUTES.SIGNUP} component={SignUp} />
      <Route path={ROUTES.FORGOT_PASSWORD} component={ForgotPassword} />
      {/* Dashboard */}
      <Route path={ROUTES.DASHBOARD} component={Dashboard} />
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
