import { create } from "zustand";
import { DRAWING_CONSTANTS } from "./constants";
import type { DrawState, DrawPath, Position } from "./types";

interface DrawingActions {
	startDrawing: (canvasPosition: Position) => void;
	addDrawPoint: (canvasPosition: Position) => void;
	endDrawing: () => void;
	clearDrawing: () => void;
}

type DrawingStore = DrawState & DrawingActions;

export const useDrawingStore = create<DrawingStore>((set, get) => ({
	isDrawing: false,
	currentPath: null,
	paths: [],

	startDrawing: (canvasPosition) => {
		set({
			isDrawing: true,
			currentPath: [canvasPosition],
		});
	},

	addDrawPoint: (canvasPosition) => {
		const { isDrawing, currentPath } = get();
		if (!isDrawing || !currentPath) return;

		set({
			currentPath: [...currentPath, canvasPosition],
		});
	},

	endDrawing: () => {
		const { isDrawing, currentPath } = get();
		if (
			!isDrawing ||
			!currentPath ||
			currentPath.length < DRAWING_CONSTANTS.MIN_PATH_POINTS
		) {
			set({
				isDrawing: false,
				currentPath: null,
			});
			return;
		}

		// Don't store the path in drawing store anymore since it will be stored as a canvas element
		// Just clear the current drawing state
		set({
			isDrawing: false,
			currentPath: null,
			// Keep existing paths as they are (for any legacy paths)
		});
	},

	clearDrawing: () =>
		set({
			paths: [],
			currentPath: null,
			isDrawing: false,
		}),
}));
