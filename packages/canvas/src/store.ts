import type { Element } from "@jammwork/api";
import { CANVAS_CONSTANTS } from "@jammwork/api";
import type { Doc } from "yjs";
import { create } from "zustand";

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
	activeTool: string;
	isSpacePressed: boolean;
	isSpacePanning: boolean;
}

export interface ContextMenuState {
	isOpen: boolean;
	position: { x: number; y: number };
	targetElementId: string | null;
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

export interface HistoryState {
	elements: Map<string, Element>;
	selectedElements: string[];
	userId?: string;
}

export interface History {
	past: HistoryState[];
	present: HistoryState;
	future: HistoryState[];
}

interface CanvasState {
	viewBox: ViewBox;
	dragState: DragState;
	toolState: ToolState;
	selectionState: SelectionState;
	contextMenuState: ContextMenuState;
	elements: Map<string, Element>;
	dimensions: {
		width: number;
		height: number;
	};
	history: History;
	currentUserId?: string;
	yjsDocument?: Doc;
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
	createElement: (element: Omit<Element, "id">) => {
		id: string;
		element: Element;
	};
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
	updateResize: (position: Position, shiftKey?: boolean) => void;
	endResize: () => void;

	// Context menu management
	openContextMenu: (
		position: Position,
		targetElementId?: string | null,
	) => void;
	closeContextMenu: () => void;

	// History management
	saveToHistory: () => void;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	setCurrentUserId: (userId: string) => void;
	setYjsDocument: (doc: Doc) => void;
}

type CanvasStore = CanvasState & CanvasActions;

const createInitialHistoryState = (): HistoryState => ({
	elements: new Map(),
	selectedElements: [],
});

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
	contextMenuState: {
		isOpen: false,
		position: { x: 0, y: 0 },
		targetElementId: null,
	},
	elements: new Map(),
	history: {
		past: [],
		present: createInitialHistoryState(),
		future: [],
	},
	currentUserId: undefined,
	yjsDocument: undefined,

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

		// Save to history after creating element
		get().saveToHistory();

		// Return both id and element to avoid timing issues
		return { id, element };
	},

	updateElement: (id, updates) => {
		set((state) => {
			const element = state.elements.get(id);
			if (!element) return state;

			const newElements = new Map(state.elements);
			newElements.set(id, { ...element, ...updates });
			return { elements: newElements };
		});

		// Save to history after updating element
		get().saveToHistory();
	},

	deleteElement: (id) => {
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
		});

		// Save to history after deleting element
		get().saveToHistory();
	},

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
			let originalBounds: {
				x: number;
				y: number;
				width: number;
				height: number;
			};
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

	updateResize: (position, shiftKey = false) =>
		set((state) => {
			const { resizeHandle } = state.selectionState;
			if (!resizeHandle) return state;

			const element = state.elements.get(resizeHandle.elementId);
			if (!element) return state;

			const { originalBounds, handle } = resizeHandle;
			const newBounds = { ...originalBounds };

			// Calculate new bounds based on resize handle
			if (shiftKey) {
				// Calculate scale factor based on the handle being used
				let scaleX = 1;
				let scaleY = 1;

				switch (handle) {
					case "nw":
						scaleX =
							(originalBounds.width + (originalBounds.x - position.x)) /
							originalBounds.width;
						scaleY =
							(originalBounds.height + (originalBounds.y - position.y)) /
							originalBounds.height;
						break;
					case "ne":
						scaleX = (position.x - originalBounds.x) / originalBounds.width;
						scaleY =
							(originalBounds.height + (originalBounds.y - position.y)) /
							originalBounds.height;
						break;
					case "sw":
						scaleX =
							(originalBounds.width + (originalBounds.x - position.x)) /
							originalBounds.width;
						scaleY = (position.y - originalBounds.y) / originalBounds.height;
						break;
					case "se":
						scaleX = (position.x - originalBounds.x) / originalBounds.width;
						scaleY = (position.y - originalBounds.y) / originalBounds.height;
						break;
					case "n":
					case "s":
						scaleY =
							handle === "n"
								? (originalBounds.height + (originalBounds.y - position.y)) /
									originalBounds.height
								: (position.y - originalBounds.y) / originalBounds.height;
						scaleX = scaleY; // Keep proportional
						break;
					case "e":
					case "w":
						scaleX =
							handle === "e"
								? (position.x - originalBounds.x) / originalBounds.width
								: (originalBounds.width + (originalBounds.x - position.x)) /
									originalBounds.width;
						scaleY = scaleX; // Keep proportional
						break;
				}

				// Use the average of both scales to maintain aspect ratio
				const scale = Math.max(0.1, Math.abs((scaleX + scaleY) / 2));

				newBounds.width = Math.max(10, originalBounds.width * scale);
				newBounds.height = Math.max(10, originalBounds.height * scale);

				// Adjust position based on handle
				switch (handle) {
					case "nw":
						newBounds.x =
							originalBounds.x + originalBounds.width - newBounds.width;
						newBounds.y =
							originalBounds.y + originalBounds.height - newBounds.height;
						break;
					case "ne":
						newBounds.x = originalBounds.x;
						newBounds.y =
							originalBounds.y + originalBounds.height - newBounds.height;
						break;
					case "sw":
						newBounds.x =
							originalBounds.x + originalBounds.width - newBounds.width;
						newBounds.y = originalBounds.y;
						break;
					case "se":
						newBounds.x = originalBounds.x;
						newBounds.y = originalBounds.y;
						break;
					case "n":
						newBounds.x =
							originalBounds.x + (originalBounds.width - newBounds.width) / 2;
						newBounds.y =
							originalBounds.y + originalBounds.height - newBounds.height;
						break;
					case "s":
						newBounds.x =
							originalBounds.x + (originalBounds.width - newBounds.width) / 2;
						newBounds.y = originalBounds.y;
						break;
					case "e":
						newBounds.x = originalBounds.x;
						newBounds.y =
							originalBounds.y + (originalBounds.height - newBounds.height) / 2;
						break;
					case "w":
						newBounds.x =
							originalBounds.x + originalBounds.width - newBounds.width;
						newBounds.y =
							originalBounds.y + (originalBounds.height - newBounds.height) / 2;
						break;
				}
			} else {
				// Normal non-proportional resizing
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

	// Context menu management
	openContextMenu: (position, targetElementId) =>
		set({
			contextMenuState: {
				isOpen: true,
				position,
				targetElementId: targetElementId || null,
			},
		}),

	closeContextMenu: () =>
		set({
			contextMenuState: {
				isOpen: false,
				position: { x: 0, y: 0 },
				targetElementId: null,
			},
		}),

	// History management
	saveToHistory: () =>
		set((state) => {
			// Only save elements created by the current user
			const userElements = new Map();
			if (state.currentUserId) {
				for (const [id, element] of state.elements) {
					if (element.createdBy === state.currentUserId) {
						userElements.set(id, element);
					}
				}
			}

			const currentState: HistoryState = {
				elements: userElements,
				selectedElements: [...state.selectionState.selectedElements],
				userId: state.currentUserId,
			};

			// Don't save if nothing has changed
			if (
				currentState.elements.size === state.history.present.elements.size &&
				Array.from(currentState.elements.entries()).every(([id, element]) => {
					const presentElement = state.history.present.elements.get(id);
					return (
						presentElement &&
						JSON.stringify(element) === JSON.stringify(presentElement)
					);
				}) &&
				JSON.stringify(currentState.selectedElements) ===
					JSON.stringify(state.history.present.selectedElements)
			) {
				return state;
			}

			const newPast = [...state.history.past, state.history.present];

			// Limit history to 20 states
			if (newPast.length > 20) {
				newPast.shift();
			}

			return {
				history: {
					past: newPast,
					present: currentState,
					future: [], // Clear future when new action is taken
				},
			};
		}),

	undo: () =>
		set((state) => {
			if (state.history.past.length === 0) return state;

			const previous = state.history.past[state.history.past.length - 1];
			const newPast = state.history.past.slice(0, -1);

			// Create new elements map with user's elements from history and keep other users' elements
			const newElements = new Map(state.elements);

			// Remove current user's elements
			if (state.currentUserId) {
				for (const [id, element] of state.elements) {
					if (element.createdBy === state.currentUserId) {
						newElements.delete(id);
					}
				}
			}

			// Add back user's elements from history state
			for (const [id, element] of previous.elements) {
				newElements.set(id, element);
			}

			const result = {
				elements: newElements,
				selectionState: {
					...state.selectionState,
					selectedElements: [...previous.selectedElements],
				},
				history: {
					past: newPast,
					present: previous,
					future: [state.history.present, ...state.history.future],
				},
			};

			// Sync with Yjs after state update
			if (state.yjsDocument) {
				const elementsMap = state.yjsDocument.getMap("elements");
				state.yjsDocument.transact(() => {
					// Update only the current user's elements in Yjs
					if (state.currentUserId) {
						// Remove user's elements that were undone
						for (const [id, element] of state.elements) {
							if (
								element.createdBy === state.currentUserId &&
								!newElements.has(id)
							) {
								elementsMap.delete(id);
							}
						}
						// Add back user's elements from history
						for (const [id, element] of previous.elements) {
							elementsMap.set(id, element);
						}
					}
				});
			}

			return result;
		}),

	redo: () =>
		set((state) => {
			if (state.history.future.length === 0) return state;

			const next = state.history.future[0];
			const newFuture = state.history.future.slice(1);

			// Create new elements map with user's elements from history and keep other users' elements
			const newElements = new Map(state.elements);

			// Remove current user's elements
			if (state.currentUserId) {
				for (const [id, element] of state.elements) {
					if (element.createdBy === state.currentUserId) {
						newElements.delete(id);
					}
				}
			}

			// Add back user's elements from history state
			for (const [id, element] of next.elements) {
				newElements.set(id, element);
			}

			const result = {
				elements: newElements,
				selectionState: {
					...state.selectionState,
					selectedElements: [...next.selectedElements],
				},
				history: {
					past: [...state.history.past, state.history.present],
					present: next,
					future: newFuture,
				},
			};

			// Sync with Yjs after state update
			if (state.yjsDocument) {
				const elementsMap = state.yjsDocument.getMap("elements");
				state.yjsDocument.transact(() => {
					// Update only the current user's elements in Yjs
					if (state.currentUserId) {
						// Remove user's elements that were in previous state
						for (const [id, element] of state.elements) {
							if (
								element.createdBy === state.currentUserId &&
								!newElements.has(id)
							) {
								elementsMap.delete(id);
							}
						}
						// Add back user's elements from redo state
						for (const [id, element] of next.elements) {
							elementsMap.set(id, element);
						}
					}
				});
			}

			return result;
		}),

	canUndo: () => get().history.past.length > 0,

	canRedo: () => get().history.future.length > 0,

	setCurrentUserId: (userId) =>
		set(() => ({
			currentUserId: userId,
		})),

	setYjsDocument: (doc) =>
		set(() => ({
			yjsDocument: doc,
		})),
}));
