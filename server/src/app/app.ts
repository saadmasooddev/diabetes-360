import express from "express";
import path from "path";
import { errorHandler } from "../shared/middleware/errorHandler";
import { registerRoutes } from "./routes";
import { setupSwagger } from "../config/swagger";
import cors from "cors";

export function createApp() {
	const app = express();

	// Basic middleware
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(
		cors({
			origin: "*",
		}),
	);

	// Serve static files from public directory (uploads)
	app.use(
		"/uploads",
		express.static(path.join(process.cwd(), "public", "uploads")),
	);

	setupSwagger(app);

	registerRoutes(app);

	app.use(errorHandler);

	return app;
}
