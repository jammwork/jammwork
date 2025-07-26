import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { serverConfig } from "./config/server.js";
import { YjsService } from "./services/yjs/index.js";
import { logger } from "./utils/logger.js";

export class Server {
	private yjsService: YjsService | null = null;
	private httpServer: any = null;

	async start() {
		try {
			// Start Yjs WebSocket service
			this.yjsService = new YjsService();

			// Create and start HTTP server
			const app = createApp();

			// Add stats endpoint with access to YjsService
			app.get("/api/stats", (c) => {
				const stats = this.yjsService?.getStats() || {};
				return c.json(stats);
			});

			this.httpServer = serve(
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
