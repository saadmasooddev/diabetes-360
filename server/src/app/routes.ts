import { type Express } from "express";
import { authRoutes } from "../modules/auth/routes/auth.routes";
import { userRoutes } from "../modules/user/routes/user.routes";
import { adminRoutes } from "../modules/admin/routes/admin.routes";
import { healthRoutes } from "../modules/health/routes/health.routes";
import { settingsRoutes } from "../modules/settings/routes/settings.routes";

export function registerRoutes(app: Express): Express {

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/settings", settingsRoutes);

  return app;
}
