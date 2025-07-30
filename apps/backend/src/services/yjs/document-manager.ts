import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as encoding from "lib0/encoding";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import * as Y from "yjs";
import { serverConfig } from "../../config/server.js";
import type { YjsConnection, YjsSpace } from "../../types/y-websocket.js";
import { logger } from "../../utils/logger.js";

const messageSync = 0;
const messageAwareness = 1;

export class DocumentManager {
	private spaces = new Map<string, YjsSpace>();
	private connections = new Set<YjsConnection>();
	private readonly dataDir = "./data/spaces";

	constructor() {
		this.ensureDataDirectory();
	}

	async createSpace(spaceName: string): Promise<YjsSpace> {
		if (this.spaces.has(spaceName)) {
			return this.spaces.get(spaceName) as YjsSpace;
		}

		// Try to load from persisted data first
		const loaded = await this.loadSpace(spaceName);
		if (loaded) {
			return this.spaces.get(spaceName) as YjsSpace;
		}

		if (this.spaces.size >= serverConfig.yjs.maxSpaces) {
			this.cleanupOldSpaces();
		}

		const doc = new Y.Doc();
		const awareness = new Awareness(doc);

		const space: YjsSpace = {
			name: spaceName,
			doc,
			awareness,
			connections: new Set(),
			lastActivity: new Date(),
		};

		// Set up document update handler
		doc.on("update", (update: Uint8Array, origin: any) => {
			space.lastActivity = new Date();
			this.broadcastUpdate(space, update, origin);
		});

		// Set up awareness change handler
		awareness.on("change", ({ added, updated, removed }: any) => {
			space.lastActivity = new Date();
			this.broadcastAwareness(space, { added, updated, removed });
		});

		this.spaces.set(spaceName, space);
		logger.info(`Created new space: ${spaceName}`);

		return space;
	}

	getSpace(spaceName: string): YjsSpace | undefined {
		return this.spaces.get(spaceName);
	}

	async getOrCreateSpace(spaceName: string): Promise<YjsSpace> {
		return this.getSpace(spaceName) || (await this.createSpace(spaceName));
	}

	async addConnection(
		spaceName: string,
		connection: YjsConnection,
	): Promise<void> {
		const space = await this.getOrCreateSpace(spaceName);
		space.connections.add(connection);
		this.connections.add(connection);

		connection.spaceName = spaceName;
		space.lastActivity = new Date();

		logger.info(`Connection added to space: ${spaceName}`, {
			connectionCount: space.connections.size,
			userId: connection.userId,
		});
	}

	removeConnection(connection: YjsConnection): void {
		const space = this.spaces.get(connection.spaceName);
		if (space) {
			space.connections.delete(connection);
			space.lastActivity = new Date();

			logger.info(`Connection removed from space: ${connection.spaceName}`, {
				connectionCount: space.connections.size,
				userId: connection.userId,
			});

			// Clean up empty spaces
			if (space.connections.size === 0) {
				setTimeout(() => {
					if (space.connections.size === 0) {
						this.spaces.delete(connection.spaceName);
						logger.info(`Cleaned up empty space: ${connection.spaceName}`);
					}
				}, 30000); // 30 second delay before cleanup
			}
		}

		this.connections.delete(connection);
	}

	private broadcastUpdate(
		space: YjsSpace,
		update: Uint8Array,
		origin: any,
	): void {
		space.connections.forEach((conn) => {
			if (conn !== origin && conn.ws.readyState === 1) {
				// WebSocket.OPEN
				try {
					const encoder = encoding.createEncoder();
					encoding.writeVarUint(encoder, messageSync);
					syncProtocol.writeUpdate(encoder, update);
					conn.ws.send(encoding.toUint8Array(encoder));
				} catch (error) {
					logger.error("Failed to broadcast update", {
						error: error instanceof Error ? error.message : String(error),
						spaceName: space.name,
					});
				}
			}
		});
	}

	private broadcastAwareness(
		space: YjsSpace,
		changes: { added: number[]; updated: number[]; removed: number[] },
	): void {
		const changedClients = changes.added
			.concat(changes.updated)
			.concat(changes.removed);
		if (changedClients.length > 0) {
			const awarenessUpdate = encodeAwarenessUpdate(
				space.awareness,
				changedClients,
			);

			space.connections.forEach((conn) => {
				if (conn.ws.readyState === 1) {
					// WebSocket.OPEN
					try {
						const encoder = encoding.createEncoder();
						encoding.writeVarUint(encoder, messageAwareness);
						encoding.writeVarUint8Array(encoder, awarenessUpdate);
						conn.ws.send(encoding.toUint8Array(encoder));
					} catch (error) {
						logger.error("Failed to broadcast awareness", {
							error: error instanceof Error ? error.message : String(error),
							spaceName: space.name,
						});
					}
				}
			});
		}
	}

	private cleanupOldSpaces(): void {
		const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

		for (const [spaceName, space] of this.spaces.entries()) {
			if (space.connections.size === 0 && space.lastActivity < cutoffTime) {
				this.spaces.delete(spaceName);
				logger.info(`Cleaned up old space: ${spaceName}`);
			}
		}
	}

	getSpaceStats(): {
		totalSpaces: number;
		totalConnections: number;
		spaces: Array<{ name: string; connections: number; lastActivity: Date }>;
	} {
		return {
			totalSpaces: this.spaces.size,
			totalConnections: this.connections.size,
			spaces: Array.from(this.spaces.values()).map((space) => ({
				name: space.name,
				connections: space.connections.size,
				lastActivity: space.lastActivity,
			})),
		};
	}

	private async ensureDataDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.dataDir, { recursive: true });
		} catch (error) {
			logger.error("Failed to create data directory", { error });
		}
	}

	private getSpaceFilePath(spaceName: string): string {
		return join(this.dataDir, `${spaceName}.json`);
	}

	async persistSpace(spaceName: string): Promise<void> {
		const space = this.spaces.get(spaceName);
		if (!space) {
			logger.warn(`Attempted to persist non-existent space: ${spaceName}`);
			return;
		}

		try {
			const update = Y.encodeStateAsUpdate(space.doc);
			const data = {
				spaceName,
				update: Array.from(update),
				lastActivity: space.lastActivity.toISOString(),
				persistedAt: new Date().toISOString(),
			};

			const filePath = this.getSpaceFilePath(spaceName);
			await fs.writeFile(filePath, JSON.stringify(data, null, 2));
			logger.info(`Persisted space: ${spaceName}`);
		} catch (error) {
			logger.error(`Failed to persist space: ${spaceName}`, { error });
		}
	}

	async loadSpace(spaceName: string): Promise<boolean> {
		try {
			const filePath = this.getSpaceFilePath(spaceName);
			const fileContent = await fs.readFile(filePath, "utf-8");
			const data = JSON.parse(fileContent);

			if (this.spaces.has(spaceName)) {
				logger.warn(`Space ${spaceName} already exists, skipping load`);
				return false;
			}

			const doc = new Y.Doc();
			const awareness = new Awareness(doc);

			const update = new Uint8Array(data.update);
			Y.applyUpdate(doc, update);

			const space: YjsSpace = {
				name: spaceName,
				doc,
				awareness,
				connections: new Set(),
				lastActivity: new Date(data.lastActivity),
			};

			doc.on("update", (update: Uint8Array, origin: any) => {
				space.lastActivity = new Date();
				this.broadcastUpdate(space, update, origin);
			});

			awareness.on("change", ({ added, updated, removed }: any) => {
				space.lastActivity = new Date();
				this.broadcastAwareness(space, { added, updated, removed });
			});

			this.spaces.set(spaceName, space);
			logger.info(
				`Loaded space: ${spaceName} (persisted at: ${data.persistedAt})`,
			);
			return true;
		} catch (error) {
			if ((error as any).code === "ENOENT") {
				logger.debug(`No persisted data found for space: ${spaceName}`);
			} else {
				logger.error(`Failed to load space: ${spaceName}`, { error });
			}
			return false;
		}
	}

	async persistAllSpaces(): Promise<void> {
		logger.info("Persisting all active spaces...");
		const persistPromises = Array.from(this.spaces.keys()).map((spaceName) =>
			this.persistSpace(spaceName),
		);
		await Promise.all(persistPromises);
		logger.info(`Persisted ${persistPromises.length} spaces`);
	}

	async loadAllPersistedSpaces(): Promise<void> {
		try {
			const files = await fs.readdir(this.dataDir);
			const jsonFiles = files.filter((file) => file.endsWith(".json"));

			logger.info(`Found ${jsonFiles.length} persisted space files`);

			const loadPromises = jsonFiles.map((file) => {
				const spaceName = file.replace(".json", "");
				return this.loadSpace(spaceName);
			});

			const results = await Promise.all(loadPromises);
			const loadedCount = results.filter(Boolean).length;
			logger.info(`Loaded ${loadedCount} persisted spaces`);
		} catch (error) {
			logger.error("Failed to load persisted spaces", { error });
		}
	}

	async cleanup(): Promise<void> {
		await this.persistAllSpaces();
		logger.info("DocumentManager cleanup completed");
	}
}
