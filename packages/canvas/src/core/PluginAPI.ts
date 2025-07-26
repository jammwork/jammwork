import { useCanvasStore } from "../stores/canvasStore";
import type { EventBus } from "./EventBus";
import type {
	PluginAPI,
	ElementRenderer,
	ToolDefinition,
	ContextMenuItem,
	Element,
	CanvasState,
	Disposable,
	PluginEvent,
	PluginEventData,
} from "../types/plugin";

export class PluginAPIImpl implements PluginAPI {
	private eventBus: EventBus;
	private elementRenderers = new Map<string, ElementRenderer>();
	private tools = new Map<string, ToolDefinition>();
	private toolbarComponents: React.ComponentType[] = [];
	private contextMenuItems: ContextMenuItem[] = [];
	private elements = new Map<string, Element>();
	private selectedElements: string[] = [];

	constructor(eventBus: EventBus) {
		this.eventBus = eventBus;
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

	registerTool(tool: ToolDefinition): Disposable {
		this.tools.set(tool.id, tool);

		return {
			dispose: () => {
				this.tools.delete(tool.id);
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

	// Core canvas state (read-only access)
	getCanvasState(): Readonly<CanvasState> {
		const state = useCanvasStore.getState();
		return {
			viewBox: { ...state.viewBox },
			dimensions: { ...state.dimensions },
			elements: new Map(this.elements),
			selectedElements: [...this.selectedElements],
		};
	}

	getSelectedElements(): readonly string[] {
		return [...this.selectedElements];
	}

	// UI extensions
	registerToolbarComponent(component: React.ComponentType): Disposable {
		this.toolbarComponents.push(component);

		return {
			dispose: () => {
				const index = this.toolbarComponents.indexOf(component);
				if (index > -1) {
					this.toolbarComponents.splice(index, 1);
				}
			},
		};
	}

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

	// Element operations via events
	createElement(element: Omit<Element, "id">): string {
		const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const newElement: Element = { ...element, id };

		this.elements.set(id, newElement);
		this.emit("element:created", { element: newElement });

		return id;
	}

	updateElement(id: string, updates: Partial<Element>): void {
		const element = this.elements.get(id);
		if (!element) {
			throw new Error(`Element with id "${id}" not found`);
		}

		const updatedElement = { ...element, ...updates, id }; // Ensure id cannot be changed
		this.elements.set(id, updatedElement);

		this.emit("element:updated", {
			id,
			element: updatedElement,
			changes: updates,
		});
	}

	deleteElement(id: string): void {
		const element = this.elements.get(id);
		if (!element) {
			throw new Error(`Element with id "${id}" not found`);
		}

		this.elements.delete(id);

		// Remove from selection if selected
		const selectedIndex = this.selectedElements.indexOf(id);
		if (selectedIndex > -1) {
			this.selectedElements.splice(selectedIndex, 1);
		}

		this.emit("element:deleted", { id, element });
	}

	selectElement(id: string): void {
		if (!this.elements.has(id)) {
			throw new Error(`Element with id "${id}" not found`);
		}

		if (!this.selectedElements.includes(id)) {
			this.selectedElements.push(id);
			// biome-ignore lint/style/noNonNullAssertion: no need to check if element exists
			const element = this.elements.get(id)!;
			this.emit("element:selected", { id, element });
			this.emit("selection:changed", {
				selected: [...this.selectedElements],
				previous: this.selectedElements.slice(0, -1),
			});
		}
	}

	deselectElement(id: string): void {
		const index = this.selectedElements.indexOf(id);
		if (index > -1) {
			const previous = [...this.selectedElements];
			this.selectedElements.splice(index, 1);

			const element = this.elements.get(id);
			if (element) {
				this.emit("element:deselected", { id, element });
				this.emit("selection:changed", {
					selected: [...this.selectedElements],
					previous,
				});
			}
		}
	}

	clearSelection(): void {
		const previous = [...this.selectedElements];
		this.selectedElements.forEach((id) => {
			const element = this.elements.get(id);
			if (element) {
				this.emit("element:deselected", { id, element });
			}
		});

		this.selectedElements = [];
		this.emit("selection:changed", {
			selected: [],
			previous,
		});
	}

	// Additional methods for internal use
	getRegisteredElementTypes(): Map<string, ElementRenderer> {
		return new Map(this.elementRenderers);
	}

	getRegisteredTools(): Map<string, ToolDefinition> {
		return new Map(this.tools);
	}

	getToolbarComponents(): React.ComponentType[] {
		return [...this.toolbarComponents];
	}

	getContextMenuItems(): ContextMenuItem[] {
		return [...this.contextMenuItems];
	}

	getElements(): Map<string, Element> {
		return new Map(this.elements);
	}
}
