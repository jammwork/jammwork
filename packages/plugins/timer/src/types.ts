export interface TimerState {
	id: string;
	duration: number; // duration in seconds
	remainingTime: number; // remaining time in seconds
	isRunning: boolean;
	isPaused: boolean;
	startTime?: number; // timestamp when timer was started
	endTime?: number; // timestamp when timer should end
}

export interface TimerElementProperties {
	duration: number;
	remainingTime: number;
	isRunning: boolean;
	isPaused: boolean;
	startTime?: number;
	endTime?: number;
	title?: string;
}
