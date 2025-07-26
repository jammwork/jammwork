import { cors } from "hono/cors";
import { serverConfig } from "../config/server.js";

export const corsMiddleware = cors({
	origin: serverConfig.cors.origins,
	credentials: serverConfig.cors.credentials,
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization"],
});
