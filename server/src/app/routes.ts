import { type Express } from "express";
import { authRoutes } from "../modules/auth/routes/auth.routes";
import { userRoutes } from "../modules/user/routes/user.routes";
import { adminRoutes } from "../modules/admin/routes/admin.routes";
import { healthRoutes } from "../modules/health/routes/health.routes";
import { settingsRoutes } from "../modules/settings/routes/settings.routes";
import { physicianRoutes } from "../modules/physician/routes/physician.routes";
import { customerRoutes } from "../modules/customer/routes/customer.routes";
import { bookingRoutes } from "../modules/booking/routes/booking.routes";
import { foodRoutes } from "../modules/food/routes/food.routes";
import { twoFactorRoutes } from "../modules/twoFactor/routes/twoFactor.routes";
import { medicalRoutes } from "../modules/medical/routes/medical.routes";

export function registerRoutes(app: Express): Express {

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/physician", physicianRoutes);
  app.use("/api/customer", customerRoutes);
  app.use("/api/booking", bookingRoutes);
  app.use("/api/food", foodRoutes);
  app.use("/api/two-factor", twoFactorRoutes);
  app.use("/api/medical", medicalRoutes);

  return app;
}
