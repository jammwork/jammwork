import { useRef, useState, useEffect, useMemo } from "react";
import { PluginManager } from "../core/PluginManager";
import { PluginAPIImpl } from "../core/PluginAPI";
import { EventBus } from "../core/EventBus";
import { DrawingPlugin } from "../plugins/drawing";
import { RectanglePlugin } from "../plugins/shapes/RectanglePlugin";
import type { Plugin } from "../types/plugin";

interface UsePluginSystemProps {
	plugins?: Plugin[];
}

export const usePluginSystem = ({
	plugins = [],
}: UsePluginSystemProps = {}) => {
	const [pluginsLoaded, setPluginsLoaded] = useState(false);
	const [initialized, setInitialized] = useState(false);

	// Initialize plugin system once and keep stable reference
	const pluginSystemRef = useRef<{
		eventBus: EventBus;
		api: PluginAPIImpl;
		manager: PluginManager;
	} | null>(null);

	if (!pluginSystemRef.current) {
		const eventBus = new EventBus();
		const api = new PluginAPIImpl(eventBus);
		const manager = new PluginManager(api);
		pluginSystemRef.current = { eventBus, api, manager };
	}

	const pluginSystem = pluginSystemRef.current;

	// Stable API reference
	const stableApi = useMemo(() => pluginSystem.api, []);

	// Memoize layer components to prevent infinite re-renders
	const layerComponents = useMemo(() => {
		return pluginsLoaded ? stableApi.getLayerComponents() : [];
	}, [pluginsLoaded, stableApi]);

	// Memoize built-in plugins to prevent recreating array on every render
	const builtInPlugins = useMemo(() => [DrawingPlugin, RectanglePlugin], []);

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
	}, [plugins, builtInPlugins, pluginSystem.manager]);

	return {
		pluginSystem,
		api: stableApi,
		layerComponents,
		pluginsLoaded,
	};
};
