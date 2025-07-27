import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import type { YjsRoom, YjsConnection } from "../../types/y-websocket.js";
import { logger } from "../../utils/logger.js";
import { serverConfig } from "../../config/server.js";

const messageSync = 0;
const messageAwareness = 1;

export class DocumentManager {
	private rooms = new Map<string, YjsRoom>();
	private connections = new Set<YjsConnection>();

	createRoom(roomName: string): YjsRoom {
		if (this.rooms.has(roomName)) {
			return this.rooms.get(roomName)!;
		}

		if (this.rooms.size >= serverConfig.yjs.maxRooms) {
			this.cleanupOldRooms();
		}

		const doc = new Y.Doc();
		const awareness = new Awareness(doc);

		const room: YjsRoom = {
			name: roomName,
			doc,
			awareness,
			connections: new Set(),
			lastActivity: new Date(),
		};

		// Set up document update handler
		doc.on("update", (update: Uint8Array, origin: any) => {
			room.lastActivity = new Date();
			this.broadcastUpdate(room, update, origin);
		});

		// Set up awareness change handler
		awareness.on("change", ({ added, updated, removed }: any) => {
			room.lastActivity = new Date();
			this.broadcastAwareness(room, { added, updated, removed });
		});

		this.rooms.set(roomName, room);
		logger.info(`Created room: ${roomName}`);

		return room;
	}

	getRoom(roomName: string): YjsRoom | undefined {
		return this.rooms.get(roomName);
	}

	getOrCreateRoom(roomName: string): YjsRoom {
		return this.getRoom(roomName) || this.createRoom(roomName);
	}

	addConnection(roomName: string, connection: YjsConnection): void {
		const room = this.getOrCreateRoom(roomName);
		room.connections.add(connection);
		this.connections.add(connection);

		connection.roomName = roomName;
		room.lastActivity = new Date();

		logger.info(`Connection added to room: ${roomName}`, {
			connectionCount: room.connections.size,
			userId: connection.userId,
		});
	}

	removeConnection(connection: YjsConnection): void {
		const room = this.rooms.get(connection.roomName);
		if (room) {
			room.connections.delete(connection);
			room.lastActivity = new Date();

			logger.info(`Connection removed from room: ${connection.roomName}`, {
				connectionCount: room.connections.size,
				userId: connection.userId,
			});

			// Clean up empty rooms
			if (room.connections.size === 0) {
				setTimeout(() => {
					if (room.connections.size === 0) {
						this.rooms.delete(connection.roomName);
						logger.info(`Cleaned up empty room: ${connection.roomName}`);
					}
				}, 30000); // 30 second delay before cleanup
			}
		}

		this.connections.delete(connection);
	}

	private broadcastUpdate(
		room: YjsRoom,
		update: Uint8Array,
		origin: any,
	): void {
		room.connections.forEach((conn) => {
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
						roomName: room.name,
					});
				}
			}
		});
	}

	private broadcastAwareness(
		room: YjsRoom,
		changes: { added: number[]; updated: number[]; removed: number[] },
	): void {
		const changedClients = changes.added
			.concat(changes.updated)
			.concat(changes.removed);
		if (changedClients.length > 0) {
			const awarenessUpdate = encodeAwarenessUpdate(
				room.awareness,
				changedClients,
			);

			room.connections.forEach((conn) => {
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
							roomName: room.name,
						});
					}
				}
			});
		}
	}

	private cleanupOldRooms(): void {
		const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

		for (const [roomName, room] of this.rooms.entries()) {
			if (room.connections.size === 0 && room.lastActivity < cutoffTime) {
				this.rooms.delete(roomName);
				logger.info(`Cleaned up old room: ${roomName}`);
			}
		}
	}

	getRoomStats(): {
		totalRooms: number;
		totalConnections: number;
		rooms: Array<{ name: string; connections: number; lastActivity: Date }>;
	} {
		return {
			totalRooms: this.rooms.size,
			totalConnections: this.connections.size,
			rooms: Array.from(this.rooms.values()).map((room) => ({
				name: room.name,
				connections: room.connections.size,
				lastActivity: room.lastActivity,
			})),
		};
	}
}
