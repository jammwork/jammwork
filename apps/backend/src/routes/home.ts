import { Hono } from "hono";
import { serverConfig } from "../config/server.js";

const homeRouter = new Hono();

homeRouter.get("/", (c) => {
	return c.text("JammWork Server - Real-time collaboration backend");
});

homeRouter.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		services: {
			http: {
				status: "running",
				port: serverConfig.http.port,
			},
			websocket: {
				status: "running",
				port: serverConfig.websocket.port,
			},
		},
		uptime: process.uptime(),
		memory: process.memoryUsage(),
	});
});

export { homeRouter };
