export interface Disposable {
	dispose(): void;
}

export interface CanvasState {
	viewBox: {
		x: number;
		y: number;
		zoom: number;
	};
	dimensions: {
		width: number;
		height: number;
	};
	elements: Map<string, Element>;
	selectedElements: string[];
}

export interface Element {
	id: string;
	type: string;
	x: number;
	y: number;
	width: number;
	height: number;
	properties: Record<string, unknown>;
	locked?: boolean;
	visible?: boolean;
}

export interface ElementRenderer {
	render(element: Element, context: RenderContext): React.ReactNode;
	getBounds(element: Element): {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	hitTest?(element: Element, point: { x: number; y: number }): boolean;
}

export interface RenderContext {
	zoom: number;
	selected: boolean;
	hovered: boolean;
}

export interface ToolDefinition {
	id: string;
	name: string;
	icon: React.ReactNode;
	cursor?: string;
	onActivate?(): void;
	onDeactivate?(): void;
	onMouseDown?(event: MouseEvent, position: { x: number; y: number }): void;
	onMouseMove?(event: MouseEvent, position: { x: number; y: number }): void;
	onMouseUp?(event: MouseEvent, position: { x: number; y: number }): void;
	onKeyDown?(event: KeyboardEvent): void;
}

export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
	shortcut?: string;
	separator?: boolean;
	submenu?: ContextMenuItem[];
	disabled?: boolean;
	onClick?(): void;
}

export interface PluginAPI {
	// Element management
	registerElementType(type: string, renderer: ElementRenderer): Disposable;
	registerTool(tool: ToolDefinition): Disposable;

	// Event bus system
	on<T extends PluginEvent>(
		event: T,
		handler: (data: PluginEventData[T]) => void,
	): Disposable;
	emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void;

	// Core canvas state (read-only access)
	getCanvasState(): Readonly<CanvasState>;
	getSelectedElements(): readonly string[];

	// UI extensions
	registerToolbarComponent(component: React.ComponentType): Disposable;
	registerContextMenuItems(items: ContextMenuItem[]): Disposable;

	// Element operations via events
	createElement(element: Omit<Element, "id">): string;
	updateElement(id: string, updates: Partial<Element>): void;
	deleteElement(id: string): void;
	selectElement(id: string): void;
	deselectElement(id: string): void;
	clearSelection(): void;
}

export interface Plugin {
	id: string;
	name: string;
	version: string;
	description?: string;
	author?: string;
	activate(api: PluginAPI): void | Promise<void>;
	deactivate?(): void | Promise<void>;
}

export interface PluginManagerConfig {
	autoLoad?: boolean;
	enableHotReload?: boolean;
}

export type PluginEvent =
	| "element:created"
	| "element:updated"
	| "element:deleted"
	| "element:selected"
	| "element:deselected"
	| "selection:changed"
	| "canvas:pan"
	| "canvas:zoom"
	| "tool:activated"
	| "tool:deactivated";

export interface PluginEventData extends Record<string | symbol, unknown> {
	"element:created": { element: Element };
	"element:updated": {
		id: string;
		element: Element;
		changes: Partial<Element>;
	};
	"element:deleted": { id: string; element: Element };
	"element:selected": { id: string; element: Element };
	"element:deselected": { id: string; element: Element };
	"selection:changed": { selected: string[]; previous: string[] };
	"canvas:pan": { x: number; y: number; deltaX: number; deltaY: number };
	"canvas:zoom": { zoom: number; centerX: number; centerY: number };
	"tool:activated": { toolId: string; tool: ToolDefinition };
	"tool:deactivated": { toolId: string; tool: ToolDefinition };
	"plugin:loaded": { plugin: Plugin };
	"plugin:unloaded": { plugin: Plugin };
	"plugin:activated": { plugin: Plugin };
	"plugin:deactivated": { plugin: Plugin };
}
