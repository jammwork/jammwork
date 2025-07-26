import type {
	CanvasState,
	ContextMenuItem,
	Disposable,
	Element,
	ElementRenderer,
	EventBus,
	PluginAPI,
	PluginEvent,
	PluginEventData,
	ToolDefinition,
	YjsDocumentManager,
} from "@jammwork/api";
import { useCanvasStore } from "@/store";

export class PluginAPIImpl implements PluginAPI {
	private eventBus: EventBus;
	private elementRenderers = new Map<string, ElementRenderer>();
	private tools = new Map<string, ToolDefinition>();
	private mainTools = new Map<string, ToolDefinition>();
	private secondaryToolsMap = new Map<string, ToolDefinition[]>(); // main tool id -> secondary tools
	private toolbarComponents: React.ComponentType[] = [];
	private contextMenuItems: ContextMenuItem[] = [];
	private layerComponents: React.ComponentType[] = [];
	private accentColor: string;
	private yjsDocumentManager?: YjsDocumentManager;

	constructor(eventBus: EventBus, accentColor = "#3b82f6") {
		this.eventBus = eventBus;
		this.accentColor = accentColor;
	}

	setYjsDocumentManager(manager: YjsDocumentManager | undefined): void {
		this.yjsDocumentManager = manager;
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

	// Core canvas state (read-only access)
	getCanvasState(): Readonly<CanvasState> {
		const state = useCanvasStore.getState();
		return {
			viewBox: { ...state.viewBox },
			dimensions: { ...state.dimensions },
			elements: new Map(state.elements),
			selectedElements: [...state.selectionState.selectedElements],
		};
	}

	getSelectedElements(): readonly string[] {
		const state = useCanvasStore.getState();
		return [...state.selectionState.selectedElements];
	}

	// Coordinate conversion utilities
	screenToCanvas(screenPosition: { x: number; y: number }): {
		x: number;
		y: number;
	} {
		const state = useCanvasStore.getState();
		return {
			x: state.viewBox.x + screenPosition.x / state.viewBox.zoom,
			y: state.viewBox.y + screenPosition.y / state.viewBox.zoom,
		};
	}

	canvasToScreen(canvasPosition: { x: number; y: number }): {
		x: number;
		y: number;
	} {
		const state = useCanvasStore.getState();
		return {
			x: (canvasPosition.x - state.viewBox.x) * state.viewBox.zoom,
			y: (canvasPosition.y - state.viewBox.y) * state.viewBox.zoom,
		};
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

	// Element operations via canvas store
	createElement(element: Omit<Element, "id">): string {
		const state = useCanvasStore.getState();
		const result = state.createElement(element) as {
			id: string;
			element: Element;
		};

		if (result?.element) {
			this.emit("element:created", { element: result.element });
			return result.id;
		} else {
			console.error("Failed to create element - unexpected return format");
			return "";
		}
	}

	// Internal method for adding elements with existing IDs (used by sync)
	addElementWithId(element: Element): void {
		const state = useCanvasStore.getState();

		// Directly add to the store without generating new ID
		const newElements = new Map(state.elements);
		newElements.set(element.id, element);

		// Update the store
		useCanvasStore.setState((currentState) => ({
			...currentState,
			elements: newElements,
		}));

		// Emit the created event
		this.emit("element:created", { element });
	}

	updateElement(id: string, updates: Partial<Element>): void {
		const state = useCanvasStore.getState();
		const element = state.elements.get(id);

		if (!element) {
			throw new Error(`Element with id "${id}" not found`);
		}

		state.updateElement(id, updates);

		const updatedElement = state.elements.get(id);
		if (updatedElement) {
			this.emit("element:updated", {
				id,
				element: updatedElement,
				changes: updates,
			});
		}
	}

	deleteElement(id: string): void {
		const state = useCanvasStore.getState();
		const element = state.elements.get(id);

		if (!element) {
			throw new Error(`Element with id "${id}" not found`);
		}

		state.deleteElement(id);
		this.emit("element:deleted", { id, element });
	}

	selectElement(id: string): void {
		const state = useCanvasStore.getState();

		if (!state.elements.has(id)) {
			console.warn(
				`Element with id "${id}" not found in store. Available elements:`,
				Array.from(state.elements.keys()),
			);
			return; // Gracefully handle missing elements instead of throwing
		}

		const wasSelected = state.selectionState.selectedElements.includes(id);
		if (!wasSelected) {
			const previous = [...state.selectionState.selectedElements];
			state.selectElement(id);

			const element = state.elements.get(id);
			if (element) {
				this.emit("element:selected", { id, element });
				this.emit("selection:changed", {
					selected: [...state.selectionState.selectedElements],
					previous,
				});
			}
		}
	}

	deselectElement(id: string): void {
		const state = useCanvasStore.getState();
		const wasSelected = state.selectionState.selectedElements.includes(id);

		if (wasSelected) {
			const previous = [...state.selectionState.selectedElements];
			state.deselectElement(id);

			const element = state.elements.get(id);
			if (element) {
				this.emit("element:deselected", { id, element });
				this.emit("selection:changed", {
					selected: [...state.selectionState.selectedElements],
					previous,
				});
			}
		}
	}

	clearSelection(): void {
		const state = useCanvasStore.getState();
		const previous = [...state.selectionState.selectedElements];

		// Emit deselected events for all elements
		previous.forEach((id) => {
			const element = state.elements.get(id);
			if (element) {
				this.emit("element:deselected", { id, element });
			}
		});

		state.clearSelection();

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

	getMainTools(): Map<string, ToolDefinition> {
		return new Map(this.mainTools);
	}

	getSecondaryTools(mainToolId: string): ToolDefinition[] {
		return this.secondaryToolsMap.get(mainToolId) || [];
	}

	getToolbarComponents(): React.ComponentType[] {
		return [...this.toolbarComponents];
	}

	getContextMenuItems(): ContextMenuItem[] {
		return [...this.contextMenuItems];
	}

	getLayerComponents(): React.ComponentType[] {
		return [...this.layerComponents];
	}

	getElements(): Map<string, Element> {
		const state = useCanvasStore.getState();
		return new Map(state.elements);
	}

	// Theme and styling
	getAccentColor(): string {
		return this.accentColor;
	}

	// Yjs synchronization
	getYjsDocumentManager(): YjsDocumentManager | undefined {
		return this.yjsDocumentManager;
	}
}
