import { create } from "zustand";

interface Position {
	x: number;
	y: number;
}

interface CircleCreationStore {
	isCreating: boolean;
	startPosition: Position | null;
	currentPosition: Position | null;

	startCreating: (position: Position) => void;
	updateCreating: (position: Position) => void;
	endCreating: () => void;
	cancelCreating: () => void;
}

export const useCircleCreationStore = create<CircleCreationStore>((set) => ({
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
		set((state) => ({
			...state,
			currentPosition: position,
		}));
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
}));
