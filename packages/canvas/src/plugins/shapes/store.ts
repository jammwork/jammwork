import { create } from "zustand";

export interface Position {
	x: number;
	y: number;
}

export interface RectangleCreationState {
	isCreating: boolean;
	startPosition: Position | null;
	currentPosition: Position | null;
}

interface RectangleCreationActions {
	startCreating: (position: Position) => void;
	updateCreating: (position: Position) => void;
	endCreating: () => void;
	cancelCreating: () => void;
}

type RectangleCreationStore = RectangleCreationState & RectangleCreationActions;

export const useRectangleCreationStore = create<RectangleCreationStore>(
	(set) => ({
		isCreating: false,
		startPosition: null,
		currentPosition: null,

		startCreating: (position) => {
			set({
				isCreating: true,
				startPosition: position,
				currentPosition: position,
			});
		},

		updateCreating: (position) => {
			set((state) => {
				if (!state.isCreating || !state.startPosition) return state;
				return {
					...state,
					currentPosition: position,
				};
			});
		},

		endCreating: () => {
			set({
				isCreating: false,
				startPosition: null,
				currentPosition: null,
			});
		},

		cancelCreating: () => {
			set({
				isCreating: false,
				startPosition: null,
				currentPosition: null,
			});
		},
	}),
);
