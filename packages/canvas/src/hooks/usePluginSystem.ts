import type { Plugin, YjsDocumentManager } from "@jammwork/api";
import { EventBus } from "@jammwork/api";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { PluginAPIImpl } from "../PluginImpl";
import { PluginManager } from "../PluginManager";
import { DrawingPlugin } from "../plugins/drawing";
import { ShapesPlugin } from "../plugins/shapes";

interface UsePluginSystemProps {
	plugins?: Plugin[];
	accentColor?: string;
	yjsDocumentManager?: YjsDocumentManager | null;
	mainDocument?: Y.Doc | null;
	awareness?: Awareness;
	userId?: string;
	spaceId?: string;
}

export const usePluginSystem = ({
	plugins = [],
	accentColor = "#3b82f6",
	yjsDocumentManager,
	mainDocument,
	awareness,
	userId = "",
	spaceId = "",
}: UsePluginSystemProps = {}) => {
	const [pluginsLoaded, setPluginsLoaded] = useState(false);

	// Create a key for the plugin system based on important parameters
	const pluginSystemKey = `${accentColor}-${userId}-${spaceId}`;

	// Initialize plugin system once and keep stable reference
	const pluginSystemRef = useRef<{
		eventBus: EventBus;
		api: PluginAPIImpl;
		manager: PluginManager;
		key: string;
	}>(null);

	// Recreate plugin system if key changes or if it doesn't exist
	if (
		!pluginSystemRef.current ||
		pluginSystemRef.current.key !== pluginSystemKey
	) {
		const eventBus = new EventBus();
		const api = new PluginAPIImpl(eventBus, accentColor, userId, spaceId);

		// Set the document manager immediately when creating the API
		if (yjsDocumentManager) {
			api.setYjsDocumentManager(yjsDocumentManager);
		}

		// Set the awareness immediately when creating the API
		if (awareness) {
			api.setAwareness(awareness);
		}

		const manager = new PluginManager(api);
		pluginSystemRef.current = { eventBus, api, manager, key: pluginSystemKey };
	} else {
		// Plugin system exists, but make sure it has the latest documentManager and awareness
		if (yjsDocumentManager) {
			pluginSystemRef.current.api.setYjsDocumentManager(yjsDocumentManager);
		}
		if (awareness) {
			pluginSystemRef.current.api.setAwareness(awareness);
		}
	}

	const pluginSystem = pluginSystemRef.current;

	// Set up synchronization
	useEffect(() => {
		if (!mainDocument) {
			return;
		}

		const elementsMap = mainDocument.getMap("elements");
		const selectionArray = mainDocument.getArray("selection");
		const viewportMap = mainDocument.getMap("viewport");

		// Flag to prevent infinite loops when applying remote changes
		let isApplyingRemoteChanges = false;

		// Listen to plugin API events and sync to Yjs
		const disposables = [
			pluginSystem.api.on("element:created", ({ element }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.set(element.id, element);
				}
			}),

			pluginSystem.api.on("element:updated", ({ id, element }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.set(id, element);
				}
			}),

			pluginSystem.api.on("element:deleted", ({ id }) => {
				if (!isApplyingRemoteChanges) {
					elementsMap.delete(id);
				}
			}),

			pluginSystem.api.on("selection:changed", ({ selected }) => {
				if (!isApplyingRemoteChanges) {
					selectionArray.delete(0, selectionArray.length);
					selectionArray.insert(0, selected);
				}
			}),

			pluginSystem.api.on("canvas:pan", ({ x, y }) => {
				viewportMap.set("x", x);
				viewportMap.set("y", y);
			}),

			pluginSystem.api.on("canvas:zoom", ({ zoom, centerX, centerY }) => {
				viewportMap.set("zoom", zoom);
				viewportMap.set("centerX", centerX);
				viewportMap.set("centerY", centerY);
			}),
		];

		// Listen to Yjs changes and update plugin API
		const handleElementsChange = () => {
			if (isApplyingRemoteChanges) {
				return;
			}

			const canvasState = pluginSystem.api.getCanvasState();
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
							// Instead of replacing the entire element, just replace it directly in the store
							// This avoids triggering another update event that could cause loops
							pluginSystem.api.addElementWithId(remoteElement);
						} else {
							// Use addElementWithId to preserve the original ID
							pluginSystem.api.addElementWithId(remoteElement);
						}
					}
				}

				// Remove elements that don't exist remotely
				for (const [id] of canvasState.elements) {
					if (!(id in remoteElements)) {
						pluginSystem.api.deleteElement(id);
					}
				}
			} finally {
				isApplyingRemoteChanges = false;
			}
		};

		const handleSelectionChange = () => {
			// Disable selection sync entirely to prevent interference with local selection
			// TODO: Implement proper collaborative selection sync that doesn't interfere with local UX
			return;
		};

		elementsMap.observe(handleElementsChange);
		selectionArray.observe(handleSelectionChange);

		return () => {
			disposables.forEach((d) => d.dispose());
			elementsMap.unobserve(handleElementsChange);
			selectionArray.unobserve(handleSelectionChange);
		};
	}, [yjsDocumentManager, mainDocument, pluginSystem.api]);

	// Stable API reference
	const stableApi = useMemo(() => pluginSystem.api, [pluginSystem]);

	// Memoize layer components to prevent infinite re-renders
	const layerComponents = useMemo(() => {
		return pluginsLoaded && stableApi ? stableApi.getLayerComponents() : [];
	}, [pluginsLoaded, stableApi]);

	// Memoize built-in plugins to prevent recreating array on every render
	const builtInPlugins = useMemo(() => [DrawingPlugin, ShapesPlugin], []);

	// Load plugins when they change
	useEffect(() => {
		let isMounted = true;

		const loadPlugins = async () => {
			if (!isMounted) return;

			// Only reload if plugins array actually changed
			const currentPlugins = pluginSystem.manager.getLoadedPlugins();
			const expectedTotal = builtInPlugins.length + plugins.length;
			const shouldReload = currentPlugins.length !== expectedTotal;

			if (!shouldReload) return;

			setPluginsLoaded(false);

			// Unload all existing plugins first
			await pluginSystem.manager.unloadAllPlugins();

			// Load built-in plugins first
			await pluginSystem.manager.loadPlugins(builtInPlugins);

			// Load user-provided plugins
			if (plugins.length > 0) {
				await pluginSystem.manager.loadPlugins(plugins);
			}

			if (isMounted) {
				setPluginsLoaded(true);
			}
		};

		loadPlugins().catch(console.error);

		return () => {
			isMounted = false;
		};
	}, [
		plugins,
		builtInPlugins,
		pluginSystem?.manager,
		yjsDocumentManager,
		userId,
		spaceId,
	]);

	return {
		pluginSystem,
		api: stableApi,
		layerComponents,
		pluginsLoaded,
	};
};
