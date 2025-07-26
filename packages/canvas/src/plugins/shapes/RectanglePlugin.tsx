import { Square } from "lucide-react";
import React from "react";
import type {
	Element,
	Plugin,
	PluginAPI,
	ToolDefinition,
} from "../../types/plugin";

const createRectangleTool = (api: PluginAPI): ToolDefinition => ({
	id: "rectangle",
	name: "Rectangle",
	icon: <Square size={16} />,
	cursor: "crosshair",

	onMouseDown: (_event, position) => {
		const canvasPosition = api.screenToCanvas(position);

		// Create a new rectangle element
		const elementId = api.createElement({
			type: "rectangle",
			x: canvasPosition.x,
			y: canvasPosition.y,
			width: 100,
			height: 80,
			properties: {
				fill: "#3b82f6",
				stroke: "#1e40af",
				strokeWidth: 2,
			},
		});

		// Select the newly created element
		api.selectElement(elementId);
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
		// Cleanup is handled by the disposables
	},
};
