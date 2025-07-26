import type { WebSocket } from "ws";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

export interface YjsConnection {
	ws: WebSocket;
	doc: Y.Doc;
	awareness: Awareness;
	roomName: string;
	userId?: string;
	isAlive: boolean;
}

export interface YjsRoom {
	name: string;
	doc: Y.Doc;
	awareness: Awareness;
	connections: Set<YjsConnection>;
	lastActivity: Date;
}

export interface YjsMessage {
	type: "sync" | "awareness" | "auth";
	data: Uint8Array;
}

export interface UserInfo {
	id: string;
	name?: string;
	color?: string;
	cursor?: { x: number; y: number };
}
