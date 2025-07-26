import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { WebSocket } from "ws";
import { applyAwarenessUpdate } from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import type { YjsConnection } from "../../types/y-websocket.js";
import { logger } from "../../utils/logger.js";
import type { DocumentManager } from "./document-manager.js";

const messageSync = 0;
const messageAwareness = 1;

export class WebSocketHandler {
	constructor(private documentManager: DocumentManager) {}

	handleConnection(
		ws: WebSocket,
		roomName: string,
		userId?: string,
	): YjsConnection {
		const room = this.documentManager.getOrCreateRoom(roomName);

		const connection: YjsConnection = {
			ws,
			doc: room.doc,
			awareness: room.awareness,
			roomName,
			userId,
			isAlive: true,
		};

		this.documentManager.addConnection(roomName, connection);
		this.setupConnectionHandlers(connection);
		this.sendSyncStep1(connection);

		return connection;
	}

	private setupConnectionHandlers(connection: YjsConnection): void {
		const { ws } = connection;

		// Handle incoming messages
		ws.on("message", (data: Buffer) => {
			try {
				this.handleMessage(connection, new Uint8Array(data));
			} catch (error) {
				logger.error("Error handling WebSocket message", {
					error: error instanceof Error ? error.message : String(error),
					roomName: connection.roomName,
					userId: connection.userId,
				});
			}
		});

		// Handle connection close
		ws.on("close", (code, reason) => {
			logger.info("WebSocket connection closed", {
				roomName: connection.roomName,
				userId: connection.userId,
				code,
				reason: reason.toString(),
			});
			this.documentManager.removeConnection(connection);
		});

		// Handle connection errors
		ws.on("error", (error) => {
			logger.error("WebSocket connection error", {
				error: error.message,
				roomName: connection.roomName,
				userId: connection.userId,
			});
			this.documentManager.removeConnection(connection);
		});

		// Set up ping/pong for connection health
		ws.on("pong", () => {
			connection.isAlive = true;
		});
	}

	private handleMessage(connection: YjsConnection, message: Uint8Array): void {
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);

		switch (messageType) {
			case messageSync:
				this.handleSyncMessage(connection, decoder);
				break;
			case messageAwareness:
				this.handleAwarenessMessage(connection, decoder);
				break;
			default:
				logger.warn("Unknown message type", {
					messageType,
					roomName: connection.roomName,
					userId: connection.userId,
				});
		}
	}

	private handleSyncMessage(
		connection: YjsConnection,
		decoder: decoding.Decoder,
	): void {
		const { doc, ws } = connection;

		try {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageSync);
			syncProtocol.readSyncMessage(decoder, encoder, doc, connection);

			if (encoding.length(encoder) > 1) {
				ws.send(encoding.toUint8Array(encoder));
			}
		} catch (error) {
			logger.error("Failed to handle sync message", {
				error: error instanceof Error ? error.message : String(error),
				roomName: connection.roomName,
				userId: connection.userId,
			});
		}
	}

	private handleAwarenessMessage(
		connection: YjsConnection,
		decoder: decoding.Decoder,
	): void {
		const { awareness } = connection;

		try {
			const awarenessUpdate = decoding.readVarUint8Array(decoder);
			applyAwarenessUpdate(awareness, awarenessUpdate, connection);
		} catch (error) {
			logger.error("Failed to handle awareness message", {
				error: error instanceof Error ? error.message : String(error),
				roomName: connection.roomName,
				userId: connection.userId,
			});
		}
	}

	private sendSyncStep1(connection: YjsConnection): void {
		const { ws, doc } = connection;

		try {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageSync);
			syncProtocol.writeSyncStep1(encoder, doc);
			ws.send(encoding.toUint8Array(encoder));
		} catch (error) {
			logger.error("Failed to send sync step 1", {
				error: error instanceof Error ? error.message : String(error),
				roomName: connection.roomName,
				userId: connection.userId,
			});
		}
	}

	pingConnections(): void {
		this.documentManager.getRoomStats().rooms.forEach((roomInfo) => {
			const room = this.documentManager.getRoom(roomInfo.name);
			if (room) {
				room.connections.forEach((connection) => {
					if (connection.isAlive === false) {
						connection.ws.terminate();
						return;
					}

					connection.isAlive = false;
					connection.ws.ping();
				});
			}
		});
	}
}
