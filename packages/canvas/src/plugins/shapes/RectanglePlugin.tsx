import { Square } from "lucide-react";
import React from "react";
import { useRectangleCreationStore } from "./store";
import { RectanglePreview } from "./components/RectanglePreview";
import type {
	Element,
	Plugin,
	PluginAPI,
	ToolDefinition,
} from "../../plugin";

const createRectangleTool = (api: PluginAPI): ToolDefinition => ({
	id: "rectangle",
	name: "Rectangle",
	icon: <Square size={16} />,
	cursor: "crosshair",

	onActivate: () => {
		// Clear any ongoing rectangle creation when tool is activated
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
			// Calculate rectangle bounds
			const x = Math.min(startPosition.x, currentPosition.x);
			const y = Math.min(startPosition.y, currentPosition.y);
			const width = Math.abs(currentPosition.x - startPosition.x);
			const height = Math.abs(currentPosition.y - startPosition.y);

			// Only create rectangle if it has meaningful size
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

				// Select the newly created element
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

const RectangleRenderer: React.FC<{ element: Element }> = ({ element }) => {
	const { x, y, width, height, properties } = element;

	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill={(properties.fill as string) || "#3b82f6"}
			stroke={(properties.stroke as string) || "#1e40af"}
			strokeWidth={(properties.strokeWidth as number) || 2}
		/>
	);
};

export const RectanglePlugin: Plugin = {
	id: "rectangle-plugin",
	name: "Rectangle Plugin",
	version: "1.0.0",
	description: "Adds rectangle creation and selection functionality",

	activate: async (api: PluginAPI) => {
		// Register the rectangle element type
		api.registerElementType("rectangle", {
			render: (element) => <RectangleRenderer element={element} />,
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		// Register the rectangle tool
		api.registerTool(createRectangleTool(api));

		// Register preview layer for rectangle creation
		api.registerLayerComponent(() => (
			<RectanglePreview accentColor={api.getAccentColor()} />
		));

		// Register a layer component to render rectangles
		api.registerLayerComponent(() => {
			const elements = api.getElements();
			const rectangles = Array.from(elements.values()).filter(
				(element): element is Element => element.type === "rectangle",
			);

			return (
				<g className="rectangles-layer">
					{rectangles.map((element) => (
						<RectangleRenderer key={element.id} element={element} />
					))}
				</g>
			);
		});
	},

	deactivate: async () => {
		// Clean up rectangle creation state
		const { cancelCreating } = useRectangleCreationStore.getState();
		cancelCreating();
	},
};
