import { Hono } from "hono";
import { homeRouter } from "./home.js";

const apiRouter = new Hono();

// Mount routers
apiRouter.route("/", homeRouter);

// API stats endpoint (could be extended for admin panel)
apiRouter.get("/api/stats", async (c) => {
	// This would need to be injected or accessed via global instance
	// For now, return basic info
	return c.json({
		message: "Stats endpoint - implement with YjsService instance",
		timestamp: new Date().toISOString(),
	});
});

export { apiRouter };
