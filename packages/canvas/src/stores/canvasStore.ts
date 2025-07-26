import { create } from "zustand";
import { CANVAS_CONSTANTS } from "@/constants";

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
}

interface CanvasState {
	viewBox: ViewBox;
	dragState: DragState;
	toolState: ToolState;
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
}

type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
	viewBox: { x: 0, y: 0, zoom: CANVAS_CONSTANTS.ZOOM.DEFAULT },
	dragState: { isDragging: false, lastPosition: null },
	dimensions: {
		width: CANVAS_CONSTANTS.VIEWPORT.DEFAULT_WIDTH,
		height: CANVAS_CONSTANTS.VIEWPORT.DEFAULT_HEIGHT,
	},
	toolState: { activeTool: "pan" },

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
}));
