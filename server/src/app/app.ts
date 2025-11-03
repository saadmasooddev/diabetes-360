import express from "express";
import { errorHandler } from "../shared/middleware/errorHandler";
import { registerRoutes } from "./routes";
import { setupSwagger } from "../config/swagger";
import { mobileResponse } from "../config/mobile";

export function createApp(){
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
 
  app.use(mobileResponse);
 
  
  setupSwagger(app);
  
  registerRoutes(app);
  
  app.use(errorHandler);
  
  return app;
}
