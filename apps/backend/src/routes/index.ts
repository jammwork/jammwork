import { Hono } from "hono";
import { DatabaseService } from "../services/database/index.js";
import { SpaceService } from "../services/space/index.js";
import { homeRouter } from "./home.js";
import { createSpaceRouter } from "./spaces.js";

const apiRouter = new Hono();

// Initialize services
const dbService = new DatabaseService();
const spaceService = new SpaceService(dbService);

// Initialize database
dbService.initialize().catch((error) => {
	console.error("Failed to initialize database:", error);
});

// Mount routers
apiRouter.route("/", homeRouter);
apiRouter.route("/api/spaces", createSpaceRouter(spaceService));

// API stats endpoint
apiRouter.get("/api/stats", async (c) => {
	return c.json({
		message: "JammWork API Stats",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

export { apiRouter };
