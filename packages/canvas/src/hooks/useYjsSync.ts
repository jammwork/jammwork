/** biome-ignore-all lint/style/noNonNullAssertion: no nullability */
import type { YjsDocumentManager } from "@jammwork/api";
import { useCallback, useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

interface UseYjsSyncProps {
	backendUrl: string;
	userId: string;
	roomId?: string;
}

interface YjsSyncResult {
	mainDocument: Y.Doc | null;
	mainProvider: WebsocketProvider | null;
	documentManager: YjsDocumentManager;
	isConnected: boolean;
	awareness: Awareness | undefined;
	updateCursorPosition: (x: number, y: number) => void;
}

export const useYjsSync = ({
	backendUrl,
	userId,
	roomId = "default-canvas",
}: UseYjsSyncProps): YjsSyncResult => {
	const documentsRef = useRef<Map<string, Y.Doc>>(new Map());
	const providersRef = useRef<Map<string, WebsocketProvider>>(new Map());
	const mainDocRef = useRef<Y.Doc | null>(null);
	const mainProviderRef = useRef<WebsocketProvider | null>(null);

	// Initialize main canvas document
	useEffect(() => {
		if (!backendUrl || !userId) return;

		const doc = new Y.Doc();
		const provider = new WebsocketProvider(backendUrl, roomId, doc);

		// Set user awareness data
		provider.awareness.setLocalStateField("user", {
			id: userId,
			name: `User ${userId}`,
			color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
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

		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				// Clear awareness when tab becomes hidden (helps with tab switches)
				provider.awareness.setLocalState(null);
			} else if (document.visibilityState === "visible") {
				// Restore awareness when tab becomes visible again
				provider.awareness.setLocalStateField("user", {
					id: userId,
					name: `User ${userId}`,
					color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
					cursor: { x: 0, y: 0 },
				});
			}
		};

		// Add event listeners for cleanup
		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("unload", handleBeforeUnload);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		mainDocRef.current = doc;
		mainProviderRef.current = provider;

		return () => {
			// Remove event listeners
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("unload", handleBeforeUnload);
			document.removeEventListener("visibilitychange", handleVisibilityChange);

			// Clear awareness state before destroying
			provider.awareness.setLocalState(null);
			provider.destroy();
			doc.destroy();
		};
	}, [backendUrl, roomId, userId]);

	// Document manager for plugins
	const documentManager: YjsDocumentManager = {
		getDocument: useCallback(
			(documentId: string) => {
				let doc = documentsRef.current.get(documentId);
				if (!doc) {
					doc = new Y.Doc();
					documentsRef.current.set(documentId, doc);

					const provider = new WebsocketProvider(
						backendUrl,
						`${roomId}-${documentId}`,
						doc,
					);
					provider.awareness.setLocalStateField("user", {
						id: userId,
						name: `User ${userId}`,
						documentId,
					});
					providersRef.current.set(documentId, provider);
				}
				return doc;
			},
			[backendUrl, roomId, userId],
		),

		createDocument: useCallback((documentId: string) => {
			if (documentsRef.current.has(documentId)) {
				throw new Error(`Document ${documentId} already exists`);
			}
			return documentManager.getDocument(documentId);
		}, []),

		deleteDocument: useCallback((documentId: string) => {
			const doc = documentsRef.current.get(documentId);
			const provider = providersRef.current.get(documentId);

			if (doc) {
				doc.destroy();
				documentsRef.current.delete(documentId);
			}

			if (provider) {
				provider.destroy();
				providersRef.current.delete(documentId);
			}
		}, []),

		getProvider: useCallback((documentId: string): unknown => {
			return providersRef.current.get(documentId);
		}, []),
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Cleanup all plugin documents
			for (const [documentId] of documentsRef.current) {
				documentManager.deleteDocument(documentId);
			}

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
