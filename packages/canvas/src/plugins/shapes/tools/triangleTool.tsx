import { Triangle } from "lucide-react";
import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { useTriangleCreationStore } from "../stores/triangleStore";

export const createTriangleTool = (api: PluginAPI): ToolDefinition => ({
	id: "triangle",
	name: "Triangle",
	icon: <Triangle size={16} />,
	cursor: "crosshair",

	onActivate: () => {
		const { cancelCreating } = useTriangleCreationStore.getState();
		cancelCreating();
	},

	onMouseDown: (_event, position) => {
		const canvasPosition = api.screenToCanvas(position);
		const { startCreating } = useTriangleCreationStore.getState();
		startCreating(canvasPosition);
	},

	onMouseMove: (_event, position) => {
		const { isCreating, updateCreating } = useTriangleCreationStore.getState();
		if (isCreating) {
			const canvasPosition = api.screenToCanvas(position);
			updateCreating(canvasPosition);
		}
	},

	onMouseUp: (_event, _position) => {
		const { isCreating, startPosition, currentPosition, endCreating } =
			useTriangleCreationStore.getState();

		if (isCreating && startPosition && currentPosition) {
			const x = Math.min(startPosition.x, currentPosition.x);
			const y = Math.min(startPosition.y, currentPosition.y);
			const width = Math.abs(currentPosition.x - startPosition.x);
			const height = Math.abs(currentPosition.y - startPosition.y);

			if (width > 5 && height > 5) {
				const accentColor = api.getAccentColor();
				const centerX = x + width / 2;
				const topY = y;
				const bottomY = y + height;
				const leftX = x;
				const rightX = x + width;

				const elementId = api.createElement({
					type: "triangle",
					x,
					y,
					width,
					height,
					properties: {
						fill: "transparent",
						stroke: accentColor,
						strokeWidth: 2,
						points: `${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`,
					},
				});

				api.selectElement(elementId);
			}

			endCreating();
		}
	},

	onKeyDown: (event) => {
		if (event.key === "Escape") {
			const { cancelCreating } = useTriangleCreationStore.getState();
			cancelCreating();
		}
	},
});
