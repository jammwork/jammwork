import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "./middleware/cors.js";
import { apiRouter } from "./routes/index.js";
import { logger as appLogger } from "./utils/logger.js";
import { serverConfig } from "./config/server.js";

export function createApp() {
	const app = new Hono();

	// Set up logging level
	appLogger.setLogLevel(serverConfig.logging.level);

	// Middleware
	app.use(
		"*",
		logger((message) => {
			appLogger.info(message);
		}),
	);

	app.use("*", corsMiddleware);

	// Routes
	app.route("/", apiRouter);

	// 404 handler
	app.notFound((c) => {
		return c.json({ error: "Not Found" }, 404);
	});

	// Error handler
	app.onError((err, c) => {
		appLogger.error("Application error", {
			error: err.message,
			stack: err.stack,
		});
		return c.json({ error: "Internal Server Error" }, 500);
	});

	return app;
}
