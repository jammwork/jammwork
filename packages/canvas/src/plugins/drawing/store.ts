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
		const { isDrawing, currentPath, paths } = get();
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

		const newPath: DrawPath = {
			id: `path_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			points: currentPath,
			color: DRAWING_CONSTANTS.DEFAULT_COLOR,
			strokeWidth: DRAWING_CONSTANTS.DEFAULT_STROKE_WIDTH,
		};

		set({
			isDrawing: false,
			currentPath: null,
			paths: [...paths, newPath],
		});
	},

	clearDrawing: () =>
		set({
			paths: [],
			currentPath: null,
			isDrawing: false,
		}),
}));
