import type { PluginAPI } from "@jammwork/api";
import type React from "react";
import { useTimerStore } from "../timerStore";
import { DurationInputDialog } from "./DurationInputDialog";

interface TimerLayerProps {
	api: PluginAPI;
}

export const TimerLayer: React.FC<TimerLayerProps> = ({ api }) => {
	const { showDurationDialog, pendingTimer, endCreating } = useTimerStore();

	const handleConfirm = (duration: number, title?: string) => {
		if (pendingTimer) {
			const elementId = api.createElement({
				type: "timer",
				x: pendingTimer.x,
				y: pendingTimer.y,
				width: 200,
				height: title ? 120 : 100,
				properties: {
					duration,
					remainingTime: duration,
					isRunning: false,
					isPaused: false,
					title,
				},
			});

			api.selectElement(elementId);
		}

		endCreating();
	};

	const handleCancel = () => {
		endCreating();
	};

	return (
		<DurationInputDialog
			open={showDurationDialog}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		/>
	);
};
