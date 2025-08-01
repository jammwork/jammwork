import type { Server as HttpServer } from "node:http";
import { WebSocketServer } from "ws";
import { serverConfig } from "../../config/server.js";
import { logger } from "../../utils/logger.js";
import { DocumentManager } from "./document-manager.js";
import { WebSocketHandler } from "./websocket-handler.js";

export class YjsService {
	private wss: WebSocketServer;
	private documentManager: DocumentManager;
	private wsHandler: WebSocketHandler;
	private pingInterval: NodeJS.Timeout | null = null;
	private httpServer?: HttpServer;

	constructor(httpServer?: HttpServer) {
		this.httpServer = httpServer;
		this.documentManager = new DocumentManager();
		this.wsHandler = new WebSocketHandler(this.documentManager);

		if (httpServer) {
			// Use the existing HTTP server
			this.wss = new WebSocketServer({ server: httpServer });
		} else {
			// Create standalone WebSocket server
			this.wss = new WebSocketServer({
				port: serverConfig.websocket.port,
				host: serverConfig.websocket.host,
			});
		}

		this.setupWebSocketServer();
		this.startHealthCheck();
	}

	async initialize(): Promise<void> {
		await this.documentManager.loadAllPersistedSpaces();
		logger.info("YjsService initialized with persisted spaces");
	}

	private setupWebSocketServer(): void {
		this.wss.on("connection", async (ws, request) => {
			const url = new URL(request.url || "/", `http://${request.headers.host}`);
			const spaceName = url.pathname.slice(1) || "default-canvas";
			const userId = url.searchParams.get("userId") || undefined;

			logger.info("Client connected", { spaceName, userId });

			try {
				await this.wsHandler.handleConnection(ws, spaceName, userId);
			} catch (error) {
				logger.error("Failed to handle WebSocket connection", {
					error: error instanceof Error ? error.message : String(error),
					spaceName,
					userId,
				});
				ws.close(1011, "Internal server error");
			}
		});

		this.wss.on("error", (error) => {
			logger.error("WebSocket server error", { error });
		});

		const port = this.httpServer
			? serverConfig.http.port
			: serverConfig.websocket.port;
		const host = this.httpServer
			? serverConfig.http.host
			: serverConfig.websocket.host;
		logger.info(`Yjs WebSocket server running on ws://${host}:${port}`);
	}

	private startHealthCheck(): void {
		// Ping clients every 30 seconds to check if they're alive
		this.pingInterval = setInterval(() => {
			this.wsHandler.pingConnections();
		}, 30000);
	}

	getStats() {
		return {
			...this.documentManager.getSpaceStats(),
			serverInfo: {
				host: serverConfig.websocket.host,
				port: serverConfig.websocket.port,
				uptime: process.uptime(),
			},
		};
	}

	async close(): Promise<void> {
		return new Promise((resolve) => {
			if (this.pingInterval) {
				clearInterval(this.pingInterval);
				this.pingInterval = null;
			}

			// Persist all spaces before closing
			this.documentManager.cleanup().then(() => {
				logger.info("YjsService closed");
				this.wss.close(() => {
					logger.info("Yjs WebSocket server closed");
					resolve();
				});
			});
		});
	}
}

export { DocumentManager } from "./document-manager.js";
export { WebSocketHandler } from "./websocket-handler.js";
