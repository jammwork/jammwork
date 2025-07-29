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

	createSpace(spaceName: string): YjsSpace {
		if (this.spaces.has(spaceName)) {
			return this.spaces.get(spaceName)!;
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
		logger.info(`Created space: ${spaceName}`);

		return space;
	}

	getSpace(spaceName: string): YjsSpace | undefined {
		return this.spaces.get(spaceName);
	}

	getOrCreateSpace(spaceName: string): YjsSpace {
		return this.getSpace(spaceName) || this.createSpace(spaceName);
	}

	addConnection(spaceName: string, connection: YjsConnection): void {
		const space = this.getOrCreateSpace(spaceName);
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
}
