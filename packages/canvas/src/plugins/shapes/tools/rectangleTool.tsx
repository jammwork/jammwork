import { Square } from "lucide-react";
import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { useRectangleCreationStore } from "../stores/rectangleStore";

export const createRectangleTool = (api: PluginAPI): ToolDefinition => ({
	id: "rectangle",
	name: "Rectangle",
	icon: <Square size={16} />,
	cursor: "crosshair",

	onActivate: () => {
		const { cancelCreating } = useRectangleCreationStore.getState();
		cancelCreating();
	},

	onMouseDown: (_event, position) => {
		const canvasPosition = api.screenToCanvas(position);
		const { startCreating } = useRectangleCreationStore.getState();
		startCreating(canvasPosition);
	},

	onMouseMove: (_event, position) => {
		const { isCreating, updateCreating } = useRectangleCreationStore.getState();
		if (isCreating) {
			const canvasPosition = api.screenToCanvas(position);
			updateCreating(canvasPosition);
		}
	},

	onMouseUp: (_event, _position) => {
		const { isCreating, startPosition, currentPosition, endCreating } =
			useRectangleCreationStore.getState();

		if (isCreating && startPosition && currentPosition) {
			const x = Math.min(startPosition.x, currentPosition.x);
			const y = Math.min(startPosition.y, currentPosition.y);
			const width = Math.abs(currentPosition.x - startPosition.x);
			const height = Math.abs(currentPosition.y - startPosition.y);

			if (width > 5 && height > 5) {
				const accentColor = api.getAccentColor();
				const elementId = api.createElement({
					type: "rectangle",
					x,
					y,
					width,
					height,
					properties: {
						fill: "transparent",
						stroke: accentColor,
						strokeWidth: 2,
					},
				});

				api.selectElement(elementId);
			}

			endCreating();
		}
	},

	onKeyDown: (event) => {
		if (event.key === "Escape") {
			const { cancelCreating } = useRectangleCreationStore.getState();
			cancelCreating();
		}
	},
});
