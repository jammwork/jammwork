import type { Server as HttpServer } from "node:http";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { serverConfig } from "./config/server.js";
import { DatabaseService } from "./services/database/index.js";
import { YjsService } from "./services/yjs/index.js";
import { logger } from "./utils/logger.js";

export class Server {
	private yjsService: YjsService | null = null;
	private httpServer: HttpServer | null = null;
	private dbService: DatabaseService | null = null;

	async start() {
		try {
			// Initialize database service
			this.dbService = new DatabaseService();
			await this.dbService.initialize();
			logger.info("Database service initialized");

			// Create and start HTTP server
			const app = createApp();

			const serverInstance = serve(
				{
					fetch: app.fetch,
					port: serverConfig.http.port,
					hostname: serverConfig.http.host,
				},
				(info) => {
					logger.info(
						`HTTP server running on http://${info.address}:${info.port}`,
					);
				},
			);

			// Extract the underlying HTTP server
			this.httpServer = serverInstance as unknown as HttpServer;

			// Start Yjs WebSocket service with HTTP server
			this.yjsService = new YjsService(this.httpServer);
			await this.yjsService.initialize();

			// Add stats endpoint with access to YjsService
			app.get("/api/stats", (c) => {
				const stats = this.yjsService?.getStats() || {};
				return c.json(stats);
			});

			// Handle graceful shutdown
			this.setupGracefulShutdown();

			logger.info("JammWork server started successfully");
		} catch (error) {
			logger.error("Failed to start server", { error });
			process.exit(1);
		}
	}

	private setupGracefulShutdown() {
		const shutdown = async (signal: string) => {
			logger.info(`Received ${signal}, shutting down gracefully`);

			try {
				if (this.yjsService) {
					await this.yjsService.close();
				}

				if (this.dbService) {
					await this.dbService.close();
				}

				if (this.httpServer) {
					// Note: @hono/node-server doesn't expose close method directly
					// In a real implementation, you might want to use a different server
					// or implement proper cleanup
				}

				logger.info("Server shut down complete");
				process.exit(0);
			} catch (error) {
				logger.error("Error during shutdown", { error });
				process.exit(1);
			}
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));
	}
}

export { YjsService } from "./services/yjs/index.js";
