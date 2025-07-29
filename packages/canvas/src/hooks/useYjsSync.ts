/** biome-ignore-all lint/suspicious/noExplicitAny: we don't know the type of the event */
import type { YjsDocumentManager } from "@jammwork/api";
import { useCallback, useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useDocumentManager } from "./useDocumentManager";

interface UseYjsSyncProps {
	backendUrl: string;
	userId: string;
	spaceId: string;
	accentColor?: string;
}

interface YjsSyncResult {
	mainDocument: Y.Doc | null;
	mainProvider: WebsocketProvider | null;
	documentManager: YjsDocumentManager | null;
	isConnected: boolean;
	awareness: Awareness | undefined;
	updateCursorPosition: (x: number, y: number) => void;
}

export const useYjsSync = ({
	backendUrl,
	userId,
	spaceId = "default-canvas",
	accentColor = "#3b82f6",
}: UseYjsSyncProps): YjsSyncResult => {
	const mainDocRef = useRef<Y.Doc | null>(null);
	const mainProviderRef = useRef<WebsocketProvider | null>(null);

	// Use the separate document manager hook
	const documentManager = useDocumentManager({
		backendUrl,
		userId,
		spaceId,
	});

	// Initialize main canvas document
	useEffect(() => {
		if (!backendUrl || !userId) return;

		const doc = new Y.Doc();
		const provider = new WebsocketProvider(
			backendUrl.replace("http", "ws"),
			spaceId,
			doc,
		);

		// Set user awareness data
		provider.awareness.setLocalStateField("user", {
			id: userId,
			name: userId,
			color: accentColor,
			cursor: { x: 0, y: 0 },
		});

		// Add connection event logging for debugging
		provider.on("status", (event: any) => {
			if (event.status !== "connected") {
				console.log("Yjs provider status:", event);
			}
		});

		provider.on("connection-close", (event: any) => {
			console.log("Yjs provider connection closed:", event);
		});

		provider.on("connection-error", (event: any) => {
			console.log("Yjs provider connection error:", event);
		});

		// Handle page unload/reload to clean up awareness
		const handleBeforeUnload = () => {
			// Clear the user's awareness state before leaving
			provider.awareness.setLocalState(null);
		};

		// Add event listeners for cleanup
		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("unload", handleBeforeUnload);

		mainDocRef.current = doc;
		mainProviderRef.current = provider;

		return () => {
			// Remove event listeners
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("unload", handleBeforeUnload);

			// Clear awareness state before destroying
			provider.awareness.setLocalState(null);
			provider.destroy();
			doc.destroy();
		};
	}, [accentColor]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Cleanup main document
			if (mainProviderRef.current) {
				mainProviderRef.current.destroy();
			}
			if (mainDocRef.current) {
				mainDocRef.current.destroy();
			}
		};
	}, []);

	const updateCursorPosition = useCallback((x: number, y: number) => {
		if (mainProviderRef.current?.awareness) {
			const currentUser =
				mainProviderRef.current.awareness.getLocalState()?.user;
			if (currentUser) {
				mainProviderRef.current.awareness.setLocalStateField("user", {
					...currentUser,
					cursor: { x, y },
				});
			}
		}
	}, []);

	return {
		mainDocument: mainDocRef.current,
		mainProvider: mainProviderRef.current,
		documentManager,
		isConnected: mainProviderRef.current?.wsconnected ?? false,
		awareness: mainProviderRef.current?.awareness,
		updateCursorPosition,
	};
};
