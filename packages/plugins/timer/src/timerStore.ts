import { create } from "zustand";
import type { TimerState } from "./types";

interface TimerCreationState {
	isCreating: boolean;
	position: { x: number; y: number } | null;
	showDurationDialog: boolean;
	pendingTimer: { x: number; y: number } | null;
}

interface TimerStoreState extends TimerCreationState {
	timers: Map<string, TimerState>;
	startCreating: (position: { x: number; y: number }) => void;
	endCreating: () => void;
	cancelCreating: () => void;
	showDurationInput: (position: { x: number; y: number }) => void;
	hideDurationInput: () => void;
	addTimer: (timer: TimerState) => void;
	updateTimer: (id: string, updates: Partial<TimerState>) => void;
	removeTimer: (id: string) => void;
	getTimer: (id: string) => TimerState | undefined;
}

export const useTimerStore = create<TimerStoreState>((set, get) => ({
	isCreating: false,
	position: null,
	showDurationDialog: false,
	pendingTimer: null,
	timers: new Map(),

	startCreating: (position) => {
		set({
			isCreating: true,
			position,
			showDurationDialog: true,
			pendingTimer: position,
		});
	},

	endCreating: () => {
		set({
			isCreating: false,
			position: null,
			showDurationDialog: false,
			pendingTimer: null,
		});
	},

	cancelCreating: () => {
		set({
			isCreating: false,
			position: null,
			showDurationDialog: false,
			pendingTimer: null,
		});
	},

	showDurationInput: (position) => {
		set({
			showDurationDialog: true,
			pendingTimer: position,
		});
	},

	hideDurationInput: () => {
		set({
			showDurationDialog: false,
			pendingTimer: null,
		});
	},

	addTimer: (timer) => {
		set((state) => {
			const newTimers = new Map(state.timers);
			newTimers.set(timer.id, timer);
			return { timers: newTimers };
		});
	},

	updateTimer: (id, updates) => {
		set((state) => {
			const newTimers = new Map(state.timers);
			const existingTimer = newTimers.get(id);
			if (existingTimer) {
				newTimers.set(id, { ...existingTimer, ...updates });
			}
			return { timers: newTimers };
		});
	},

	removeTimer: (id) => {
		set((state) => {
			const newTimers = new Map(state.timers);
			newTimers.delete(id);
			return { timers: newTimers };
		});
	},

	getTimer: (id) => {
		return get().timers.get(id);
	},
}));
