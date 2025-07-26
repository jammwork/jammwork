import { Circle } from "lucide-react";
import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { useShapeCreationStore } from "../shapesStore";

export const createCircleTool = (api: PluginAPI): ToolDefinition => ({
	id: "circle",
	name: "Circle",
	icon: <Circle size={16} />,
	cursor: "crosshair",

	onActivate: () => {
		const { cancelCreating } = useShapeCreationStore.getState();
		cancelCreating();
	},

	onMouseDown: (_event, position) => {
		const canvasPosition = api.screenToCanvas(position);
		const { startCreating } = useShapeCreationStore.getState();
		startCreating("circle", canvasPosition);
	},

	onMouseMove: (_event, position) => {
		const { isCreating, updateCreating } = useShapeCreationStore.getState();
		if (isCreating) {
			const canvasPosition = api.screenToCanvas(position);
			updateCreating(canvasPosition);
		}
	},

	onMouseUp: (_event, _position) => {
		const { isCreating, startPosition, currentPosition, endCreating } =
			useShapeCreationStore.getState();

		if (isCreating && startPosition && currentPosition) {
			const centerX = startPosition.x;
			const centerY = startPosition.y;
			const radiusX = Math.abs(currentPosition.x - startPosition.x);
			const radiusY = Math.abs(currentPosition.y - startPosition.y);

			if (radiusX > 5 && radiusY > 5) {
				const accentColor = api.getAccentColor();
				const elementId = api.createElement({
					type: "circle",
					x: centerX - radiusX,
					y: centerY - radiusY,
					width: radiusX * 2,
					height: radiusY * 2,
					properties: {
						fill: "transparent",
						stroke: accentColor,
						strokeWidth: 2,
						centerX,
						centerY,
						radiusX,
						radiusY,
						// Keep backwards compatibility with old radius property
						radius: Math.min(radiusX, radiusY),
					},
				});

				api.selectElement(elementId);
			}

			endCreating();
		}
	},

	onKeyDown: (event) => {
		if (event.key === "Escape") {
			const { cancelCreating } = useShapeCreationStore.getState();
			cancelCreating();
		}
	},
});
