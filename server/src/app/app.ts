import express from "express";
import { errorHandler } from "../shared/middleware/errorHandler";
import { registerRoutes } from "./routes";
import { setupSwagger } from "../config/swagger";

export function createApp(){
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Register routes
  registerRoutes(app);
  
  // Error handling middleware (must be last)
  app.use(errorHandler);
  
  return app;
}
