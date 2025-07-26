import type { ToolPlugin, PluginRegistry } from "../types/plugin";

class PluginRegistryImpl implements PluginRegistry {
	private plugins = new Map<string, ToolPlugin>();

	register(plugin: ToolPlugin): void {
		this.plugins.set(plugin.id, plugin);
	}

	unregister(pluginId: string): void {
		this.plugins.delete(pluginId);
	}

	getPlugin(pluginId: string): ToolPlugin | undefined {
		return this.plugins.get(pluginId);
	}

	getAllPlugins(): ToolPlugin[] {
		return Array.from(this.plugins.values());
	}
}

export const pluginRegistry = new PluginRegistryImpl();
