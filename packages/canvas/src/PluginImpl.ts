import type {
	CanvasState,
	ContextMenuItem,
	Disposable,
	Element,
	ElementRenderer,
	EventBus,
	MenuItem,
	PluginAPI,
	PluginEvent,
	PluginEventData,
	ToolDefinition,
	YjsDocumentManager,
} from "@jammwork/api";
import type { Awareness } from "y-protocols/awareness";
import { useCanvasStore } from "@/store";

export class PluginAPIImpl implements PluginAPI {
	private eventBus: EventBus;
	private elementRenderers = new Map<string, ElementRenderer>();
	private tools = new Map<string, ToolDefinition>();
	private mainTools = new Map<string, ToolDefinition>();
	private secondaryToolsMap = new Map<string, ToolDefinition[]>(); // main tool id -> secondary tools
	private contextMenuItems: ContextMenuItem[] = [];
	private layerComponents: React.ComponentType[] = [];
	private menuItems: MenuItem[] = [];
	private accentColor: string;
	private yjsDocumentManager?: YjsDocumentManager;
	private awareness?: Awareness;
	private userId: string;
	private spaceId: string;
	private highlightedTools = new Set<string>();

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

	setYjsDocumentManager(manager: YjsDocumentManager | undefined): void {
		this.yjsDocumentManager = manager;
	}

	setAwareness(awareness: Awareness): void {
		this.awareness = awareness;
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

	// Element operations via canvas store
	createElement(element: Omit<Element, "id">): string {
		const state = useCanvasStore.getState();
		// Add createdBy field to track the user who created this element
		const elementWithCreator = {
			...element,
			createdBy: this.userId,
		};
		const result = state.createElement(elementWithCreator) as {
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

		// Update element in store
		state.updateElement(id, updates);

		// Get the updated element from fresh state
		const freshState = useCanvasStore.getState();
		const updatedElement = freshState.elements.get(id);

		if (updatedElement) {
			// Emit the updated event for sync with Yjs
			this.emit("element:updated", {
				id,
				element: updatedElement,
				changes: updates,
			});
		} else {
			console.error(
				`Failed to get updated element with id "${id}" after update`,
			);
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

	// Tool highlight control
	setToolHighlight(toolId: string, highlighted: boolean): void {
		if (highlighted) {
			this.highlightedTools.add(toolId);
		} else {
			this.highlightedTools.delete(toolId);
		}
	}

	isToolHighlighted(toolId: string): boolean {
		return this.highlightedTools.has(toolId);
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

	getElements(): Map<string, Element> {
		const state = useCanvasStore.getState();
		return new Map(state.elements);
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

	// Yjs synchronization
	getYjsDocumentManager(): YjsDocumentManager {
		if (!this.yjsDocumentManager) {
			throw new Error("YjsDocumentManager not available");
		}
		return this.yjsDocumentManager;
	}

	getAwareness(): Awareness {
		if (!this.awareness) {
			throw new Error("Awareness not available");
		}
		return this.awareness;
	}
}
