import type { WebSocket } from "ws";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

export interface YjsConnection {
	ws: WebSocket;
	doc: Y.Doc;
	awareness: Awareness;
	spaceName: string;
	userId?: string;
	isAlive: boolean;
}

export interface YjsSpace {
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
