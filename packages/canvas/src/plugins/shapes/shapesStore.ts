import type { Element } from "@jammwork/api";
import { create } from "zustand";

export interface Position {
	x: number;
	y: number;
}

export type ShapeType = "rectangle" | "circle" | "triangle";

export interface ShapeCreationState {
	isCreating: boolean;
	shapeType: ShapeType | null;
	startPosition: Position | null;
	currentPosition: Position | null;
}

export interface TextEditingState {
	isEditing: boolean;
	editingElement: Element | null;
}

interface ShapeCreationActions {
	startCreating: (shapeType: ShapeType, position: Position) => void;
	updateCreating: (position: Position) => void;
	endCreating: () => void;
	cancelCreating: () => void;
}

interface TextEditingActions {
	startTextEditing: (element: Element) => void;
	endTextEditing: () => void;
}

type ShapeCreationStore = ShapeCreationState &
	TextEditingState &
	ShapeCreationActions &
	TextEditingActions;

export const useShapeCreationStore = create<ShapeCreationStore>((set) => ({
	isCreating: false,
	shapeType: null,
	startPosition: null,
	currentPosition: null,
	isEditing: false,
	editingElement: null,

	startCreating: (shapeType, position) => {
		set({
			isCreating: true,
			shapeType,
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
			shapeType: null,
			startPosition: null,
			currentPosition: null,
		});
	},

	cancelCreating: () => {
		set({
			isCreating: false,
			shapeType: null,
			startPosition: null,
			currentPosition: null,
		});
	},

	startTextEditing: (element) => {
		set({
			isEditing: true,
			editingElement: element,
		});
	},

	endTextEditing: () => {
		set({
			isEditing: false,
			editingElement: null,
		});
	},
}));
