import { create } from "zustand";
import { CANVAS_CONSTANTS } from "@/constants";
import type { Element } from "./plugin";

export interface ViewBox {
	x: number;
	y: number;
	zoom: number;
}

export interface Position {
	x: number;
	y: number;
}

export interface DragState {
	isDragging: boolean;
	lastPosition: Position | null;
}

export type CanvasTool = "select" | "pan";

export interface ToolState {
	activeTool: string; // Changed to string to support dynamic plugin tools
	isSpacePressed: boolean;
	isSpacePanning: boolean;
}

export interface SelectionState {
	selectedElements: string[];
	hoveredElement: string | null;
	selectionBox: {
		isActive: boolean;
		startX: number;
		startY: number;
		endX: number;
		endY: number;
	} | null;
	draggedElement: {
		id: string;
		offset: Position;
	} | null;
	resizeHandle: {
		elementId: string;
		handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
		originalBounds: { x: number; y: number; width: number; height: number };
	} | null;
}

interface CanvasState {
	viewBox: ViewBox;
	dragState: DragState;
	toolState: ToolState;
	selectionState: SelectionState;
	elements: Map<string, Element>;
	dimensions: {
		width: number;
		height: number;
	};
}

interface CanvasActions {
	setViewBox: (viewBox: Partial<ViewBox>) => void;
	startDrag: (position: Position) => void;
	updateDrag: (position: Position) => void;
	endDrag: () => void;
	setDimensions: (width: number, height: number) => void;
	panBy: (deltaX: number, deltaY: number) => void;
	zoomTo: (zoom: number, centerX?: number, centerY?: number) => void;
	zoomAt: (deltaZoom: number, centerX: number, centerY: number) => void;
	setActiveTool: (tool: string) => void;
	setSpacePressed: (pressed: boolean) => void;
	setSpacePanning: (panning: boolean) => void;

	// Element management
	createElement: (element: Omit<Element, "id">) => string;
	updateElement: (id: string, updates: Partial<Element>) => void;
	deleteElement: (id: string) => void;
	getElementById: (id: string) => Element | undefined;

	// Selection management
	selectElement: (id: string, multi?: boolean) => void;
	deselectElement: (id: string) => void;
	clearSelection: () => void;
	setHoveredElement: (id: string | null) => void;

	// Selection box
	startSelectionBox: (position: Position) => void;
	updateSelectionBox: (position: Position) => void;
	endSelectionBox: () => void;

	// Element dragging
	startElementDrag: (elementId: string, offset: Position) => void;
	updateElementDrag: (position: Position) => void;
	endElementDrag: () => void;

	// Resize handles
	startResize: (
		elementId: string,
		handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w",
	) => void;
	updateResize: (position: Position) => void;
	endResize: () => void;
}

type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
	viewBox: { x: 0, y: 0, zoom: CANVAS_CONSTANTS.ZOOM.DEFAULT },
	dragState: { isDragging: false, lastPosition: null },
	dimensions: {
		width: CANVAS_CONSTANTS.VIEWPORT.DEFAULT_WIDTH,
		height: CANVAS_CONSTANTS.VIEWPORT.DEFAULT_HEIGHT,
	},
	toolState: {
		activeTool: "pan",
		isSpacePressed: false,
		isSpacePanning: false,
	},
	selectionState: {
		selectedElements: [],
		hoveredElement: null,
		selectionBox: null,
		draggedElement: null,
		resizeHandle: null,
	},
	elements: new Map(),

	setViewBox: (partialViewBox) =>
		set((state) => ({
			viewBox: { ...state.viewBox, ...partialViewBox },
		})),

	startDrag: (position) =>
		set({
			dragState: { isDragging: true, lastPosition: position },
		}),

	updateDrag: (position) => {
		const { dragState, viewBox } = get();
		if (!dragState.isDragging || !dragState.lastPosition) return;

		const deltaX = position.x - dragState.lastPosition.x;
		const deltaY = position.y - dragState.lastPosition.y;

		set({
			viewBox: {
				...viewBox,
				x: viewBox.x - deltaX / viewBox.zoom,
				y: viewBox.y - deltaY / viewBox.zoom,
			},
			dragState: { ...dragState, lastPosition: position },
		});
	},

	endDrag: () =>
		set({
			dragState: { isDragging: false, lastPosition: null },
		}),

	setDimensions: (width, height) =>
		set({
			dimensions: { width, height },
		}),

	panBy: (deltaX, deltaY) => {
		const { viewBox } = get();
		set({
			viewBox: {
				...viewBox,
				x: viewBox.x + deltaX,
				y: viewBox.y + deltaY,
			},
		});
	},

	zoomTo: (zoom, centerX, centerY) => {
		const { viewBox } = get();
		const newZoom = Math.max(
			CANVAS_CONSTANTS.ZOOM.MIN,
			Math.min(CANVAS_CONSTANTS.ZOOM.MAX, zoom),
		);

		if (centerX !== undefined && centerY !== undefined) {
			const worldX = viewBox.x + centerX / viewBox.zoom;
			const worldY = viewBox.y + centerY / viewBox.zoom;

			set({
				viewBox: {
					x: worldX - centerX / newZoom,
					y: worldY - centerY / newZoom,
					zoom: newZoom,
				},
			});
		} else {
			set({
				viewBox: { ...viewBox, zoom: newZoom },
			});
		}
	},

	zoomAt: (deltaZoom, centerX, centerY) => {
		const { viewBox } = get();
		const zoomFactor = 1 + deltaZoom * 0.001;
		const newZoom = Math.max(
			CANVAS_CONSTANTS.ZOOM.MIN,
			Math.min(CANVAS_CONSTANTS.ZOOM.MAX, viewBox.zoom * zoomFactor),
		);

		const worldX = viewBox.x + centerX / viewBox.zoom;
		const worldY = viewBox.y + centerY / viewBox.zoom;

		set({
			viewBox: {
				x: worldX - centerX / newZoom,
				y: worldY - centerY / newZoom,
				zoom: newZoom,
			},
		});
	},

	setActiveTool: (tool) =>
		set((state) => ({
			toolState: { ...state.toolState, activeTool: tool },
		})),

	setSpacePressed: (pressed) =>
		set((state) => ({
			toolState: { ...state.toolState, isSpacePressed: pressed },
		})),

	setSpacePanning: (panning) =>
		set((state) => ({
			toolState: { ...state.toolState, isSpacePanning: panning },
		})),

	// Element management
	createElement: (elementData) => {
		const id = `element-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
		const element: Element = { id, ...elementData };

		set((state) => {
			const newElements = new Map(state.elements);
			newElements.set(id, element);
			return { elements: newElements };
		});

		return id;
	},

	updateElement: (id, updates) =>
		set((state) => {
			const element = state.elements.get(id);
			if (!element) return state;

			const newElements = new Map(state.elements);
			newElements.set(id, { ...element, ...updates });
			return { elements: newElements };
		}),

	deleteElement: (id) =>
		set((state) => {
			const newElements = new Map(state.elements);
			newElements.delete(id);

			const selectedElements = state.selectionState.selectedElements.filter(
				(selectedId) => selectedId !== id,
			);

			return {
				elements: newElements,
				selectionState: {
					...state.selectionState,
					selectedElements,
					hoveredElement:
						state.selectionState.hoveredElement === id
							? null
							: state.selectionState.hoveredElement,
				},
			};
		}),

	getElementById: (id) => get().elements.get(id),

	// Selection management
	selectElement: (id, multi = false) =>
		set((state) => {
			const selectedElements = multi
				? state.selectionState.selectedElements.includes(id)
					? state.selectionState.selectedElements.filter(
							(selectedId) => selectedId !== id,
						)
					: [...state.selectionState.selectedElements, id]
				: [id];

			return {
				selectionState: {
					...state.selectionState,
					selectedElements,
				},
			};
		}),

	deselectElement: (id) =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				selectedElements: state.selectionState.selectedElements.filter(
					(selectedId) => selectedId !== id,
				),
			},
		})),

	clearSelection: () =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				selectedElements: [],
			},
		})),

	setHoveredElement: (id) =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				hoveredElement: id,
			},
		})),

	// Selection box
	startSelectionBox: (position) =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				selectionBox: {
					isActive: true,
					startX: position.x,
					startY: position.y,
					endX: position.x,
					endY: position.y,
				},
			},
		})),

	updateSelectionBox: (position) =>
		set((state) => {
			if (!state.selectionState.selectionBox) return state;

			return {
				selectionState: {
					...state.selectionState,
					selectionBox: {
						...state.selectionState.selectionBox,
						endX: position.x,
						endY: position.y,
					},
				},
			};
		}),

	endSelectionBox: () =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				selectionBox: null,
			},
		})),

	// Element dragging
	startElementDrag: (elementId, offset) =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				draggedElement: { id: elementId, offset },
			},
		})),

	updateElementDrag: (position) =>
		set((state) => {
			const { draggedElement, selectedElements } = state.selectionState;
			if (!draggedElement) return state;

			const draggedElementData = state.elements.get(draggedElement.id);
			if (!draggedElementData) return state;

			// Calculate the delta movement
			const newX = position.x - draggedElement.offset.x;
			const newY = position.y - draggedElement.offset.y;
			const deltaX = newX - draggedElementData.x;
			const deltaY = newY - draggedElementData.y;

			const newElements = new Map(state.elements);

			// Move all selected elements by the same delta
			for (const elementId of selectedElements) {
				const element = state.elements.get(elementId);
				if (element) {
					const updatedElement = {
						...element,
						x: element.x + deltaX,
						y: element.y + deltaY,
					};

					// Handle special properties for different element types
					if (element.type === "circle") {
						// Update circle center coordinates
						const centerX = element.properties.centerX as number;
						const centerY = element.properties.centerY as number;
						updatedElement.properties = {
							...element.properties,
							centerX: centerX + deltaX,
							centerY: centerY + deltaY,
						};
					} else if (element.type === "triangle") {
						// Update triangle points
						const points = element.properties.points as string;
						const pointsArray = points.split(" ");
						const updatedPoints = pointsArray
							.map((point) => {
								const [x, y] = point.split(",").map(Number);
								return `${x + deltaX},${y + deltaY}`;
							})
							.join(" ");
						updatedElement.properties = {
							...element.properties,
							points: updatedPoints,
						};
					}

					newElements.set(elementId, updatedElement);
				}
			}

			return { elements: newElements };
		}),

	endElementDrag: () =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				draggedElement: null,
			},
		})),

	// Resize handles
	startResize: (elementId, handle) =>
		set((state) => {
			const element = state.elements.get(elementId);
			if (!element) return state;

			// Get bounds based on element type
			let originalBounds;
			if (element.type === "circle") {
				// Use radiusX/radiusY if available, fallback to radius for backwards compatibility
				const radiusX =
					(element.properties.radiusX as number) ||
					(element.properties.radius as number);
				const radiusY =
					(element.properties.radiusY as number) ||
					(element.properties.radius as number);
				const centerX = element.properties.centerX as number;
				const centerY = element.properties.centerY as number;
				originalBounds = {
					x: centerX - radiusX,
					y: centerY - radiusY,
					width: radiusX * 2,
					height: radiusY * 2,
				};
			} else {
				originalBounds = {
					x: element.x,
					y: element.y,
					width: element.width,
					height: element.height,
				};
			}

			return {
				selectionState: {
					...state.selectionState,
					resizeHandle: {
						elementId,
						handle,
						originalBounds,
					},
				},
			};
		}),

	updateResize: (position) =>
		set((state) => {
			const { resizeHandle } = state.selectionState;
			if (!resizeHandle) return state;

			const element = state.elements.get(resizeHandle.elementId);
			if (!element) return state;

			const { originalBounds, handle } = resizeHandle;
			const newBounds = { ...originalBounds };

			// Calculate new bounds based on resize handle
			switch (handle) {
				case "nw":
					newBounds.width = Math.max(
						10,
						originalBounds.width + (originalBounds.x - position.x),
					);
					newBounds.height = Math.max(
						10,
						originalBounds.height + (originalBounds.y - position.y),
					);
					newBounds.x = position.x;
					newBounds.y = position.y;
					break;
				case "ne":
					newBounds.width = Math.max(10, position.x - originalBounds.x);
					newBounds.height = Math.max(
						10,
						originalBounds.height + (originalBounds.y - position.y),
					);
					newBounds.y = position.y;
					break;
				case "sw":
					newBounds.width = Math.max(
						10,
						originalBounds.width + (originalBounds.x - position.x),
					);
					newBounds.height = Math.max(10, position.y - originalBounds.y);
					newBounds.x = position.x;
					break;
				case "se":
					newBounds.width = Math.max(10, position.x - originalBounds.x);
					newBounds.height = Math.max(10, position.y - originalBounds.y);
					break;
				case "n":
					newBounds.height = Math.max(
						10,
						originalBounds.height + (originalBounds.y - position.y),
					);
					newBounds.y = position.y;
					break;
				case "s":
					newBounds.height = Math.max(10, position.y - originalBounds.y);
					break;
				case "e":
					newBounds.width = Math.max(10, position.x - originalBounds.x);
					break;
				case "w":
					newBounds.width = Math.max(
						10,
						originalBounds.width + (originalBounds.x - position.x),
					);
					newBounds.x = position.x;
					break;
			}

			const newElements = new Map(state.elements);

			// Handle different element types during resize
			if (element.type === "circle") {
				// For circles/ellipses, allow independent width and height scaling
				const newCenterX = newBounds.x + newBounds.width / 2;
				const newCenterY = newBounds.y + newBounds.height / 2;
				const radiusX = newBounds.width / 2;
				const radiusY = newBounds.height / 2;

				newElements.set(resizeHandle.elementId, {
					...element,
					x: newBounds.x,
					y: newBounds.y,
					width: newBounds.width,
					height: newBounds.height,
					properties: {
						...element.properties,
						centerX: newCenterX,
						centerY: newCenterY,
						radiusX: radiusX,
						radiusY: radiusY,
						// Keep backwards compatibility with old radius property
						radius: Math.min(radiusX, radiusY),
					},
				});
			} else if (element.type === "triangle") {
				// For triangles, update points based on new bounds
				const centerX = newBounds.x + newBounds.width / 2;
				const topY = newBounds.y;
				const bottomY = newBounds.y + newBounds.height;
				const leftX = newBounds.x;
				const rightX = newBounds.x + newBounds.width;
				const newPoints = `${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`;

				newElements.set(resizeHandle.elementId, {
					...element,
					x: newBounds.x,
					y: newBounds.y,
					width: newBounds.width,
					height: newBounds.height,
					properties: {
						...element.properties,
						points: newPoints,
					},
				});
			} else {
				// Default behavior for rectangles and other shapes
				newElements.set(resizeHandle.elementId, {
					...element,
					x: newBounds.x,
					y: newBounds.y,
					width: newBounds.width,
					height: newBounds.height,
				});
			}

			return { elements: newElements };
		}),

	endResize: () =>
		set((state) => ({
			selectionState: {
				...state.selectionState,
				resizeHandle: null,
			},
		})),
}));
