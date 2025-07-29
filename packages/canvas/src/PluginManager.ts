import type {
	Disposable,
	Plugin,
	PluginAPI,
	PluginManagerConfig,
} from "@jammwork/api";
import { EventBus } from "@jammwork/api";

export class PluginManager {
	private plugins = new Map<string, Plugin>();
	private activePlugins = new Map<
		string,
		{ plugin: Plugin; disposables: Disposable[] }
	>();
	private eventBus: EventBus;
	private api: PluginAPI;
	private config: PluginManagerConfig;

	constructor(api: PluginAPI, config: PluginManagerConfig = {}) {
		this.eventBus = new EventBus();
		this.api = api;
		this.config = {
			autoLoad: true,
			enableHotReload: false,
			...config,
		};
	}

	async loadPlugin(plugin: Plugin): Promise<void> {
		if (this.plugins.has(plugin.id)) {
			return;
		}

		this.plugins.set(plugin.id, plugin);

		if (this.config.autoLoad) {
			await this.activatePlugin(plugin.id);
		}

		this.eventBus.emit("plugin:loaded", { plugin });
	}

	async loadPlugins(plugins: Plugin[]): Promise<void> {
		for (const plugin of plugins) {
			await this.loadPlugin(plugin);
		}
	}

	async activatePlugin(pluginId: string): Promise<void> {
		const plugin = this.plugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin "${pluginId}" not found`);
		}

		if (this.activePlugins.has(pluginId)) {
			console.warn(`Plugin "${pluginId}" is already active`);
			return;
		}

		const disposables: Disposable[] = [];
		const pluginAPI: PluginAPI = {
			// Element management
			registerElementType: this.api.registerElementType.bind(this.api),
			registerTool: this.api.registerTool.bind(this.api),

			// Event bus system (override with disposable tracking)
			on: (event, handler) => {
				const disposable = this.eventBus.on(event, handler);
				disposables.push(disposable);
				return disposable;
			},
			emit: (event, data) => {
				this.eventBus.emit(event, data);
			},

			// Core canvas state
			getCanvasState: this.api.getCanvasState.bind(this.api),
			getSelectedElements: this.api.getSelectedElements.bind(this.api),

			// Coordinate conversion utilities
			screenToCanvas: this.api.screenToCanvas.bind(this.api),
			canvasToScreen: this.api.canvasToScreen.bind(this.api),

			// UI extensions
			registerContextMenuItems: this.api.registerContextMenuItems.bind(
				this.api,
			),
			registerLayerComponent: this.api.registerLayerComponent.bind(this.api),
			registerMenuItem: this.api.registerMenuItem.bind(this.api),

			// Registry access methods
			getRegisteredTools: this.api.getRegisteredTools.bind(this.api),
			getLayerComponents: this.api.getLayerComponents.bind(this.api),
			getElements: this.api.getElements.bind(this.api),
			getMenuItems: this.api.getMenuItems.bind(this.api),

			// Theme and styling
			getAccentColor: this.api.getAccentColor.bind(this.api),

			// User identification
			getUserId: this.api.getUserId.bind(this.api),
			getSpaceId: this.api.getSpaceId.bind(this.api),

			// Element operations
			createElement: this.api.createElement.bind(this.api),
			updateElement: this.api.updateElement.bind(this.api),
			deleteElement: this.api.deleteElement.bind(this.api),
			selectElement: this.api.selectElement.bind(this.api),
			deselectElement: this.api.deselectElement.bind(this.api),
			clearSelection: this.api.clearSelection.bind(this.api),
			getMainTools: this.api.getMainTools.bind(this.api),
			getSecondaryTools: this.api.getSecondaryTools.bind(this.api),

			// Tool highlight control
			setToolHighlight: this.api.setToolHighlight.bind(this.api),
			isToolHighlighted: this.api.isToolHighlighted.bind(this.api),

			// Yjs synchronization
			getYjsDocumentManager: this.api.getYjsDocumentManager.bind(this.api),
			getAwareness: this.api.getAwareness.bind(this.api),
		};

		try {
			await plugin.activate(pluginAPI);
			this.activePlugins.set(pluginId, { plugin, disposables });
			this.eventBus.emit("plugin:activated", { plugin });
		} catch (error) {
			console.error(`Failed to activate plugin "${pluginId}":`, error);
			disposables.forEach((d) => d.dispose());
			throw new Error(`Failed to activate plugin "${pluginId}": ${error}`);
		}
	}

	async deactivatePlugin(pluginId: string): Promise<void> {
		const activePlugin = this.activePlugins.get(pluginId);
		if (!activePlugin) {
			console.warn(`Plugin "${pluginId}" is not active`);
			return;
		}

		try {
			if (activePlugin.plugin.deactivate) {
				await activePlugin.plugin.deactivate();
			}

			activePlugin.disposables.forEach((d) => d.dispose());
			this.activePlugins.delete(pluginId);
			this.eventBus.emit("plugin:deactivated", { plugin: activePlugin.plugin });
		} catch (error) {
			console.error(`Error deactivating plugin "${pluginId}":`, error);
			throw error;
		}
	}

	async unloadPlugin(pluginId: string): Promise<void> {
		if (this.activePlugins.has(pluginId)) {
			await this.deactivatePlugin(pluginId);
		}

		const plugin = this.plugins.get(pluginId);
		if (plugin) {
			this.plugins.delete(pluginId);
			this.eventBus.emit("plugin:unloaded", { plugin });
		}
	}

	async reloadPlugin(pluginId: string, newPlugin: Plugin): Promise<void> {
		if (this.isPluginActive(pluginId)) {
			await this.deactivatePlugin(pluginId);
		}

		this.plugins.set(pluginId, newPlugin);

		if (this.config.autoLoad) {
			await this.activatePlugin(pluginId);
		}
	}

	getLoadedPlugins(): Plugin[] {
		return Array.from(this.plugins.values());
	}

	getActivePlugins(): Plugin[] {
		return Array.from(this.activePlugins.values()).map((ap) => ap.plugin);
	}

	isPluginLoaded(pluginId: string): boolean {
		return this.plugins.has(pluginId);
	}

	isPluginActive(pluginId: string): boolean {
		return this.activePlugins.has(pluginId);
	}

	getPlugin(pluginId: string): Plugin | undefined {
		return this.plugins.get(pluginId);
	}

	async activateAllPlugins(): Promise<void> {
		for (const [pluginId] of this.plugins) {
			if (!this.activePlugins.has(pluginId)) {
				try {
					await this.activatePlugin(pluginId);
				} catch (error) {
					console.error(`Failed to activate plugin "${pluginId}":`, error);
				}
			}
		}
	}

	async deactivateAllPlugins(): Promise<void> {
		for (const [pluginId] of this.activePlugins) {
			try {
				await this.deactivatePlugin(pluginId);
			} catch (error) {
				console.error(`Failed to deactivate plugin "${pluginId}":`, error);
			}
		}
	}

	async unloadAllPlugins(): Promise<void> {
		await this.deactivateAllPlugins();
		this.plugins.clear();
	}

	getEventBus(): EventBus {
		return this.eventBus;
	}
}
