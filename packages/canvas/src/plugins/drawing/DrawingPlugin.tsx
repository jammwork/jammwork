import { Pen } from "lucide-react";
import { useDrawingStore } from "./store";
import { DrawingLayer } from "./components/DrawingLayer";
import type { Plugin, ToolDefinition, PluginAPI } from "../../types/plugin";

const createDrawingTool = (api: PluginAPI): ToolDefinition => ({
	id: "draw",
	name: "Draw",
	icon: <Pen size={16} />,
	cursor: "crosshair",

	onMouseDown: (event, position) => {
		const { startDrawing } = useDrawingStore.getState();
		const canvasPosition = api.screenToCanvas(position);
		startDrawing(canvasPosition);
	},

	onMouseMove: (event, position) => {
		const { addDrawPoint } = useDrawingStore.getState();
		const canvasPosition = api.screenToCanvas(position);
		addDrawPoint(canvasPosition);
	},

	onMouseUp: (event, position) => {
		const { endDrawing } = useDrawingStore.getState();
		endDrawing();
	},

	onKeyDown: (event) => {
		if (event.key.toLowerCase() === "c" && (event.ctrlKey || event.metaKey)) {
			const { clearDrawing } = useDrawingStore.getState();
			clearDrawing();
			event.preventDefault();
		}
	},
});

export const DrawingPlugin: Plugin = {
	id: "drawing",
	name: "Drawing Tool",
	version: "1.0.0",
	description: "Provides freehand drawing capabilities on the canvas",
	author: "Canvas Team",

	activate: (api) => {
		try {
			// Register the drawing tool with coordinate conversion
			const drawingTool = createDrawingTool(api);

			if (!api.registerTool) {
				throw new Error("api.registerTool is not available");
			}

			api.registerTool(drawingTool);

			// Register the drawing layer component
			api.registerLayerComponent(DrawingLayer);
		} catch (error) {
			console.error("Error activating drawing plugin:", error);
		}
	},

	deactivate: () => {
		// Clean up drawing state
		const { clearDrawing } = useDrawingStore.getState();
		clearDrawing();
		console.log("Drawing plugin deactivated");
	},
};

// Export the DrawingLayer for manual integration
export { DrawingLayer };
