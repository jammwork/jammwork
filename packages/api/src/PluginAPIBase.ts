import type { Awareness } from "y-protocols/awareness";
import type { EventBus } from "./EventBus";

import type {
	CanvasState,
	ContextMenuItem,
	Disposable,
	Element,
	ElementRenderer,
	MenuItem,
	PluginAPI,
	PluginEvent,
	PluginEventData,
	ToolDefinition,
	YjsDocumentManager,
} from "./Plugin";

export abstract class PluginAPIBase implements PluginAPI {
	protected eventBus: EventBus;
	protected elementRenderers = new Map<string, ElementRenderer>();
	protected tools = new Map<string, ToolDefinition>();
	protected mainTools = new Map<string, ToolDefinition>();
	protected secondaryToolsMap = new Map<string, ToolDefinition[]>(); // main tool id -> secondary tools
	protected contextMenuItems: ContextMenuItem[] = [];
	protected layerComponents: React.ComponentType[] = [];
	protected menuItems: MenuItem[] = [];
	protected accentColor: string;
	protected userId: string;
	protected spaceId: string;

	constructor(
		eventBus: EventBus,
		accentColor = "#3b82f6",
		userId = "",
		spaceId = "",
	) {
		this.eventBus = eventBus;
		this.accentColor = accentColor;
		this.userId = userId;
		this.spaceId = spaceId;
	}

	// Element management
	registerElementType(type: string, renderer: ElementRenderer): Disposable {
		this.elementRenderers.set(type, renderer);

		return {
			dispose: () => {
				this.elementRenderers.delete(type);
			},
		};
	}

	registerTool(
		tool: ToolDefinition,
		options?: { secondary?: ToolDefinition[] },
	): Disposable {
		// Register the main tool
		this.tools.set(tool.id, tool);
		this.mainTools.set(tool.id, tool);

		// Register secondary tools if provided
		if (options?.secondary) {
			this.secondaryToolsMap.set(tool.id, options.secondary);

			// Register all secondary tools in the main tools map for lookup
			options.secondary.forEach((secondaryTool) => {
				this.tools.set(secondaryTool.id, secondaryTool);
			});
		}

		return {
			dispose: () => {
				this.tools.delete(tool.id);
				this.mainTools.delete(tool.id);

				// Clean up secondary tools
				const secondaryTools = this.secondaryToolsMap.get(tool.id);
				if (secondaryTools) {
					secondaryTools.forEach((secondaryTool) => {
						this.tools.delete(secondaryTool.id);
					});
					this.secondaryToolsMap.delete(tool.id);
				}
			},
		};
	}

	// Event bus system
	on<T extends PluginEvent>(
		event: T,
		handler: (data: PluginEventData[T]) => void,
	): Disposable {
		return this.eventBus.on(event, handler);
	}

	emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void {
		this.eventBus.emit(event, data);
	}

	// UI extensions
	registerContextMenuItems(items: ContextMenuItem[]): Disposable {
		this.contextMenuItems.push(...items);

		return {
			dispose: () => {
				items.forEach((item) => {
					const index = this.contextMenuItems.findIndex(
						(existing) => existing.id === item.id,
					);
					if (index > -1) {
						this.contextMenuItems.splice(index, 1);
					}
				});
			},
		};
	}

	registerLayerComponent(component: React.ComponentType): Disposable {
		this.layerComponents.push(component);

		return {
			dispose: () => {
				const index = this.layerComponents.indexOf(component);
				if (index > -1) {
					this.layerComponents.splice(index, 1);
				}
			},
		};
	}

	registerMenuItem(item: MenuItem): Disposable {
		// Insert menu item in order (lower order values appear first)
		const order = item.order ?? 100;
		const insertIndex = this.menuItems.findIndex(
			(existingItem) => (existingItem.order ?? 100) > order,
		);

		if (insertIndex === -1) {
			this.menuItems.push(item);
		} else {
			this.menuItems.splice(insertIndex, 0, item);
		}

		return {
			dispose: () => {
				const index = this.menuItems.findIndex(
					(existingItem) => existingItem.id === item.id,
				);
				if (index > -1) {
					this.menuItems.splice(index, 1);
				}
			},
		};
	}

	// Registry access methods
	getRegisteredElementTypes(): Map<string, ElementRenderer> {
		return new Map(this.elementRenderers);
	}

	getRegisteredTools(): Map<string, ToolDefinition> {
		return new Map(this.tools);
	}

	getMainTools(): Map<string, ToolDefinition> {
		return new Map(this.mainTools);
	}

	getSecondaryTools(mainToolId: string): ToolDefinition[] {
		return this.secondaryToolsMap.get(mainToolId) || [];
	}

	getContextMenuItems(): ContextMenuItem[] {
		return [...this.contextMenuItems];
	}

	getLayerComponents(): React.ComponentType[] {
		return [...this.layerComponents];
	}

	getMenuItems(position?: "top-right"): MenuItem[] {
		if (position) {
			return this.menuItems.filter((item) => item.position === position);
		}
		return [...this.menuItems];
	}

	// Theme and styling
	getAccentColor(): string {
		return this.accentColor;
	}

	// User identification
	getUserId(): string {
		return this.userId;
	}

	// Space identification
	getSpaceId(): string {
		return this.spaceId;
	}

	// Abstract methods that must be implemented by concrete classes
	abstract setToolHighlight(toolId: string, highlighted: boolean): void;
	abstract isToolHighlighted(toolId: string): boolean;
	abstract getCanvasState(): Readonly<CanvasState>;
	abstract getSelectedElements(): readonly string[];
	abstract screenToCanvas(screenPosition: { x: number; y: number }): {
		x: number;
		y: number;
	};
	abstract canvasToScreen(canvasPosition: { x: number; y: number }): {
		x: number;
		y: number;
	};
	abstract getElements(): Map<string, Element>;
	abstract createElement(element: Omit<Element, "id">): string;
	abstract updateElement(id: string, updates: Partial<Element>): void;
	abstract deleteElement(id: string): void;
	abstract selectElement(id: string): void;
	abstract deselectElement(id: string): void;
	abstract clearSelection(): void;

	// Yjs synchronization
	abstract getYjsDocumentManager(): YjsDocumentManager;
	abstract getAwareness(): Awareness;
}
