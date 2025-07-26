import React from "react";
import { Square } from "lucide-react";
import type { Plugin, PluginAPI } from "../../plugin";
import { createRectangleTool } from "./tools/rectangleTool";
import { createCircleTool } from "./tools/circleTool";
import { createTriangleTool } from "./tools/triangleTool";
import { RectangleRenderer } from "./renderers/RectangleRenderer";
import { CircleRenderer } from "./renderers/CircleRenderer";
import { TriangleRenderer } from "./renderers/TriangleRenderer";
import { createRectangleLayer } from "./layers/RectangleLayer";
import { createCircleLayer } from "./layers/CircleLayer";
import { createTriangleLayer } from "./layers/TriangleLayer";
import { RectanglePreview } from "./components/RectanglePreview";
import { CirclePreview } from "./components/CirclePreview";
import { TrianglePreview } from "./components/TrianglePreview";
import { useRectangleCreationStore } from "./stores/rectangleStore";
import { useCircleCreationStore } from "./stores/circleStore";
import { useTriangleCreationStore } from "./stores/triangleStore";

export const ShapesPlugin: Plugin = {
	id: "shapes-plugin",
	name: "Shapes Plugin",
	version: "1.0.0",
	description: "Adds rectangle, circle, and triangle creation functionality",

	activate: async (api: PluginAPI) => {
		// Create individual tools
		const rectangleTool = createRectangleTool(api);
		const circleTool = createCircleTool(api);
		const triangleTool = createTriangleTool(api);

		// Register the main shapes tool with secondary tools
		api.registerTool(
			{
				id: "shapes",
				name: "Shapes",
				icon: <Square size={16} />,
				cursor: "crosshair",
				// Default to rectangle tool behavior when shapes is selected
				onActivate: rectangleTool.onActivate,
				onDeactivate: rectangleTool.onDeactivate,
				onMouseDown: rectangleTool.onMouseDown,
				onMouseMove: rectangleTool.onMouseMove,
				onMouseUp: rectangleTool.onMouseUp,
				onKeyDown: rectangleTool.onKeyDown,
			},
			{
				secondary: [rectangleTool, circleTool, triangleTool],
			},
		);

		// Register element types
		api.registerElementType("rectangle", {
			render: (element) => <RectangleRenderer element={element} />,
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		api.registerElementType("circle", {
			render: (element) => <CircleRenderer element={element} />,
			getBounds: (element) => {
				// Use radiusX/radiusY if available, fallback to radius for backwards compatibility
				const radiusX =
					(element.properties.radiusX as number) ||
					(element.properties.radius as number);
				const radiusY =
					(element.properties.radiusY as number) ||
					(element.properties.radius as number);
				const centerX = element.properties.centerX as number;
				const centerY = element.properties.centerY as number;
				return {
					x: centerX - radiusX,
					y: centerY - radiusY,
					width: radiusX * 2,
					height: radiusY * 2,
				};
			},
		});

		api.registerElementType("triangle", {
			render: (element) => <TriangleRenderer element={element} />,
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		// Register preview layers
		api.registerLayerComponent(() => (
			<RectanglePreview accentColor={api.getAccentColor()} />
		));
		api.registerLayerComponent(() => (
			<CirclePreview accentColor={api.getAccentColor()} />
		));
		api.registerLayerComponent(() => (
			<TrianglePreview accentColor={api.getAccentColor()} />
		));

		// Register shape layer components
		api.registerLayerComponent(createRectangleLayer(api));
		api.registerLayerComponent(createCircleLayer(api));
		api.registerLayerComponent(createTriangleLayer(api));
	},

	deactivate: async () => {
		// Clean up creation states
		const { cancelCreating: cancelRectangle } =
			useRectangleCreationStore.getState();
		const { cancelCreating: cancelCircle } = useCircleCreationStore.getState();
		const { cancelCreating: cancelTriangle } =
			useTriangleCreationStore.getState();

		cancelRectangle();
		cancelCircle();
		cancelTriangle();
	},
};
