import { registerRoutes } from "./src/app/routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { createApp } from "./src/app/app";
import { config } from "./src/app/config";
import { db } from "./src/app/config/db";

const app = createApp();

(async () => {
	const appWithRoutes = registerRoutes(app);
	const server = createServer(appWithRoutes);
	await db.execute("SELECT 1");

	// importantly only setup vite in development and after
	// setting up all the other routes so the catch-all route
	// doesn't interfere with the other routes
	if (app.get("env") === "development") {
		await setupVite(app, server);
	} else {
		serveStatic(app);
	}

	const port = config.port;
	server.listen(
		{
			port,
			host: "0.0.0.0",
			// reusePort: true,
		},
		() => {
			log(`serving on port ${port}`);
		},
	);
})();
