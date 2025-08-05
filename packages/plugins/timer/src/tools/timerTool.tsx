import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { Timer } from "lucide-react";
import { useTimerStore } from "../timerStore";

export const createTimerTool = (api: PluginAPI): ToolDefinition => ({
	id: "timer",
	name: "Timer",
	icon: <Timer size={16} />,
	cursor: "crosshair",

	onActivate: () => {
		const { cancelCreating } = useTimerStore.getState();
		cancelCreating();
	},

	onMouseDown: (_event, position) => {
		const canvasPosition = api.screenToCanvas(position);
		const { startCreating } = useTimerStore.getState();
		startCreating(canvasPosition);
	},

	onKeyDown: (event) => {
		if (event.key === "Escape") {
			const { cancelCreating } = useTimerStore.getState();
			cancelCreating();
		}
	},
});
