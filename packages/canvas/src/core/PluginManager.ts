import {
	Plugin,
	PluginAPI,
	PluginManagerConfig,
	Disposable,
} from "../types/plugin";
import { EventBus } from "./EventBus";

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
			throw new Error(`Plugin with id "${plugin.id}" is already loaded`);
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
			...this.api,
			on: (event, handler) => {
				const disposable = this.eventBus.on(event, handler);
				disposables.push(disposable);
				return disposable;
			},
			emit: (event, data) => {
				this.eventBus.emit(event, data);
			},
		};

		try {
			await plugin.activate(pluginAPI);
			this.activePlugins.set(pluginId, { plugin, disposables });
			this.eventBus.emit("plugin:activated", { plugin });
		} catch (error) {
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
