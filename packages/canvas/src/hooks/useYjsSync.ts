/** biome-ignore-all lint/style/noNonNullAssertion: no nullability */
import type { PluginAPI, YjsDocumentManager } from "@jammwork/api";
import { useCallback, useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

interface UseYjsSyncProps {
	backendUrl: string;
	userId: string;
	roomId?: string;
	pluginApi?: PluginAPI;
}

interface YjsSyncResult {
	mainDocument: Y.Doc | null;
	mainProvider: WebsocketProvider | null;
	documentManager: YjsDocumentManager;
	isConnected: boolean;
	awareness: Awareness | undefined;
}

export const useYjsSync = ({
	backendUrl,
	userId,
	roomId = "default-canvas",
	pluginApi,
}: UseYjsSyncProps): YjsSyncResult => {
	const documentsRef = useRef<Map<string, Y.Doc>>(new Map());
	const providersRef = useRef<Map<string, WebsocketProvider>>(new Map());
	const mainDocRef = useRef<Y.Doc | null>(null);
	const mainProviderRef = useRef<WebsocketProvider | null>(null);
	const pluginApiRef = useRef<PluginAPI | undefined>(pluginApi);

	// Update plugin API ref when it changes
	useEffect(() => {
		pluginApiRef.current = pluginApi;
	}, [pluginApi]);

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

		mainDocRef.current = doc;
		mainProviderRef.current = provider;

		return () => {
			provider.destroy();
			doc.destroy();
		};
	}, [backendUrl, roomId, userId]);

	// Set up plugin API synchronization when both doc and API are available
	useEffect(() => {
		if (!mainDocRef.current || !pluginApiRef.current) return;

		const doc = mainDocRef.current;
		const elementsMap = doc.getMap("elements");
		const selectionArray = doc.getArray("selection");
		const viewportMap = doc.getMap("viewport");

		// Listen to plugin API events and sync to Yjs
		const disposables = [
			pluginApiRef.current.on("element:created", ({ element }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.set(element.id, element);
				}
			}),

			pluginApiRef.current.on("element:updated", ({ id, element }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.set(id, element);
				}
			}),

			pluginApiRef.current.on("element:deleted", ({ id }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.delete(id);
				}
			}),

			pluginApiRef.current.on("selection:changed", ({ selected }) => {
				if (!isApplyingRemoteChanges) {
					selectionArray.delete(0, selectionArray.length);
					selectionArray.insert(0, selected);
				}
			}),

			pluginApiRef.current.on("canvas:pan", ({ x, y }) => {
				viewportMap.set("x", x);
				viewportMap.set("y", y);
			}),

			pluginApiRef.current.on("canvas:zoom", ({ zoom, centerX, centerY }) => {
				viewportMap.set("zoom", zoom);
				viewportMap.set("centerX", centerX);
				viewportMap.set("centerY", centerY);
			}),
		];

		// Flag to prevent infinite loops when applying remote changes
		let isApplyingRemoteChanges = false;

		// Listen to Yjs changes and update plugin API
		const handleElementsChange = () => {
			if (isApplyingRemoteChanges) {
				return;
			}

			const canvasState = pluginApiRef.current!.getCanvasState();
			// biome-ignore lint/suspicious/noExplicitAny: we don't know the type of the elements
			const remoteElements = elementsMap.toJSON() as Record<string, any>;

			isApplyingRemoteChanges = true;

			try {
				// Update elements that don't match remote state
				for (const [id, remoteElement] of Object.entries(remoteElements)) {
					const localElement = canvasState.elements.get(id);
					if (
						!localElement ||
						JSON.stringify(localElement) !== JSON.stringify(remoteElement)
					) {
						if (localElement) {
							pluginApiRef.current!.updateElement(id, remoteElement);
						} else {
							// Use addElementWithId to preserve the original ID
							(pluginApiRef.current as any).addElementWithId(remoteElement);
						}
					}
				}

				// Remove elements that don't exist remotely
				for (const [id] of canvasState.elements) {
					if (!(id in remoteElements)) {
						pluginApiRef.current!.deleteElement(id);
					}
				}
			} finally {
				isApplyingRemoteChanges = false;
			}
		};

		const handleSelectionChange = () => {
			const remoteSelection = selectionArray.toArray() as string[];
			const localSelection = pluginApiRef.current!.getSelectedElements();

			if (JSON.stringify(remoteSelection) !== JSON.stringify(localSelection)) {
				pluginApiRef.current!.clearSelection();
				remoteSelection.forEach((id) =>
					pluginApiRef.current!.selectElement(id),
				);
			}
		};

		elementsMap.observe(handleElementsChange);
		selectionArray.observe(handleSelectionChange);

		return () => {
			disposables.forEach((d) => d.dispose());
			elementsMap.unobserve(handleElementsChange);
			selectionArray.unobserve(handleSelectionChange);
		};
	}, [mainDocRef.current, pluginApiRef.current]);

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

	return {
		mainDocument: mainDocRef.current,
		mainProvider: mainProviderRef.current,
		documentManager,
		isConnected: mainProviderRef.current?.wsconnected ?? false,
		awareness: mainProviderRef.current?.awareness,
	};
};
