import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

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
	onDoubleClick?(event: MouseEvent, position: { x: number; y: number }): void;
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

export interface YjsDocumentManager {
	getDocument(documentId: string): Y.Doc;
	createDocument(documentId: string): Y.Doc;
	deleteDocument(documentId: string): void;
	getProvider(documentId: string): unknown; // WebsocketProvider type not available in API package
}

export interface PluginAPI {
	// Element management
	registerElementType(type: string, renderer: ElementRenderer): Disposable;
	registerTool(
		tool: ToolDefinition,
		options?: { secondary?: ToolDefinition[] },
	): Disposable;

	// Event bus system
	on<T extends PluginEvent>(
		event: T,
		handler: (data: PluginEventData[T]) => void,
	): Disposable;
	emit<T extends PluginEvent>(event: T, data: PluginEventData[T]): void;

	// Core canvas state (read-only access)
	getCanvasState(): Readonly<CanvasState>;
	getSelectedElements(): readonly string[];

	// Coordinate conversion utilities
	screenToCanvas(screenPosition: { x: number; y: number }): {
		x: number;
		y: number;
	};
	canvasToScreen(canvasPosition: { x: number; y: number }): {
		x: number;
		y: number;
	};

	// UI extensions
	registerToolbarComponent(component: React.ComponentType): Disposable;
	registerContextMenuItems(items: ContextMenuItem[]): Disposable;
	registerLayerComponent(component: React.ComponentType): Disposable;

	// Registry access methods
	getRegisteredTools(): Map<string, ToolDefinition>;
	getMainTools(): Map<string, ToolDefinition>;
	getSecondaryTools(mainToolId: string): ToolDefinition[];
	getLayerComponents(): React.ComponentType[];
	getElements(): Map<string, Element>;

	// Tool highlight control
	setToolHighlight(toolId: string, highlighted: boolean): void;
	isToolHighlighted(toolId: string): boolean;

	// Theme and styling
	getAccentColor(): string;

	// User identification
	getUserId(): string;

	// Room identification
	getRoomId(): string;

	// Element operations via events
	createElement(element: Omit<Element, "id">): string;
	updateElement(id: string, updates: Partial<Element>): void;
	deleteElement(id: string): void;
	selectElement(id: string): void;
	deselectElement(id: string): void;
	clearSelection(): void;

	// Yjs synchronization
	getYjsDocumentManager(): YjsDocumentManager;
	getAwareness(): Awareness; // Awareness type not available in API package
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
	| "element:doubleclick"
	| "selection:changed"
	| "canvas:pan"
	| "canvas:zoom"
	| "canvas:doubleclick"
	| "tool:activated"
	| "tool:deactivated"
	| "plugin:loaded"
	| "plugin:unloaded"
	| "plugin:activated"
	| "plugin:deactivated";

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
	"element:doubleclick": {
		element: Element;
		position: { x: number; y: number };
		screenPosition: { x: number; y: number };
	};
	"selection:changed": { selected: string[]; previous: string[] };
	"canvas:pan": { x: number; y: number; deltaX: number; deltaY: number };
	"canvas:zoom": { zoom: number; centerX: number; centerY: number };
	"canvas:doubleclick": {
		screenPosition: { x: number; y: number };
		canvasPosition: { x: number; y: number };
	};
	"tool:activated": { toolId: string; tool: ToolDefinition };
	"tool:deactivated": { toolId: string; tool: ToolDefinition };
	"plugin:loaded": { plugin: Plugin };
	"plugin:unloaded": { plugin: Plugin };
	"plugin:activated": { plugin: Plugin };
	"plugin:deactivated": { plugin: Plugin };
}
