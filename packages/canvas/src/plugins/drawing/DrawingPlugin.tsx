import type {
	Element,
	ElementRenderer,
	Plugin,
	PluginAPI,
	ToolDefinition,
} from "@jammwork/api";
import { Pen } from "lucide-react";
import { DrawingLayer } from "./components/DrawingLayer";
import { useDrawingStore } from "./store";
import type { Position } from "./types";

// Helper function to calculate distance from point to line segment
const distanceToLineSegment = (
	point: { x: number; y: number },
	lineStart: { x: number; y: number },
	lineEnd: { x: number; y: number },
): number => {
	const A = point.x - lineStart.x;
	const B = point.y - lineStart.y;
	const C = lineEnd.x - lineStart.x;
	const D = lineEnd.y - lineStart.y;

	const dot = A * C + B * D;
	const lenSq = C * C + D * D;

	if (lenSq === 0) {
		// Line segment is actually a point
		return Math.sqrt(A * A + B * B);
	}

	const param = dot / lenSq;

	let xx: number;
	let yy: number;

	if (param < 0) {
		xx = lineStart.x;
		yy = lineStart.y;
	} else if (param > 1) {
		xx = lineEnd.x;
		yy = lineEnd.y;
	} else {
		xx = lineStart.x + param * C;
		yy = lineStart.y + param * D;
	}

	const dx = point.x - xx;
	const dy = point.y - yy;
	return Math.sqrt(dx * dx + dy * dy);
};

// Path element renderer
const pathFromPoints = (points: Position[]): string => {
	if (points.length === 0) return "";

	let path = `M ${points[0].x} ${points[0].y}`;

	if (points.length === 1) {
		// Single point - draw a small line
		return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
	}

	for (let i = 1; i < points.length; i++) {
		path += ` L ${points[i].x} ${points[i].y}`;
	}

	return path;
};

const PathElementRenderer: React.FC<{ element: Element }> = ({ element }) => {
	const points = element.properties.points as Position[];
	const color = element.properties.color as string;
	const strokeWidth = element.properties.strokeWidth as number;

	// Calculate the original bounds to determine offset
	const originalPoints =
		(element.properties.originalPoints as Position[]) || points;
	const xs = originalPoints.map((p) => p.x);
	const ys = originalPoints.map((p) => p.y);
	const originalMinX = Math.min(...xs);
	const originalMinY = Math.min(...ys);

	// Apply transform based on element position
	const offsetX = element.x - originalMinX;
	const offsetY = element.y - originalMinY;

	return (
		<g transform={`translate(${offsetX}, ${offsetY})`}>
			<path
				d={pathFromPoints(points)}
				stroke={color}
				strokeWidth={strokeWidth}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</g>
	);
};

const createDrawingTool = (api: PluginAPI): ToolDefinition => ({
	id: "draw",
	name: "Draw",
	icon: <Pen size={16} />,
	cursor: "crosshair",

	onMouseDown: (_event, position) => {
		const { startDrawing } = useDrawingStore.getState();
		const canvasPosition = api.screenToCanvas(position);
		startDrawing(canvasPosition);
	},

	onMouseMove: (_event, position) => {
		const { addDrawPoint } = useDrawingStore.getState();
		const canvasPosition = api.screenToCanvas(position);
		addDrawPoint(canvasPosition);
	},

	onMouseUp: (_event, _position) => {
		const { endDrawing, currentPath } = useDrawingStore.getState();

		// Create an element in the canvas store when drawing is complete
		if (currentPath && currentPath.length >= 2) {
			// Calculate bounds for the path
			const xs = currentPath.map((p) => p.x);
			const ys = currentPath.map((p) => p.y);
			const minX = Math.min(...xs);
			const minY = Math.min(...ys);
			const maxX = Math.max(...xs);
			const maxY = Math.max(...ys);

			// Create element with proper bounds
			api.createElement({
				type: "drawing-path",
				x: minX,
				y: minY,
				width: maxX - minX,
				height: maxY - minY,
				properties: {
					points: currentPath,
					originalPoints: currentPath, // Store original points for position calculations
					color: api.getAccentColor(),
					strokeWidth: 2,
				},
			});
		}

		endDrawing();

		// Note: endDrawing() already clears the current path from the drawing store
		// The completed path is now stored as a canvas element
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
			// Register the path element type
			const pathElementRenderer: ElementRenderer = {
				render: (element) => <PathElementRenderer element={element} />,
				getBounds: (element) => ({
					x: element.x,
					y: element.y,
					width: element.width,
					height: element.height,
				}),
				hitTest: (element, point) => {
					// Enhanced hit testing for path elements
					const points = element.properties.points as Position[];
					const strokeWidth = (element.properties.strokeWidth as number) || 2;
					const tolerance = Math.max(strokeWidth / 2, 5); // Minimum 5px tolerance

					// Check if point is near any line segment in the path
					for (let i = 0; i < points.length - 1; i++) {
						const p1 = points[i];
						const p2 = points[i + 1];

						const distance = distanceToLineSegment(point, p1, p2);
						if (distance <= tolerance) {
							return true;
						}
					}

					return false;
				},
			};

			api.registerElementType("drawing-path", pathElementRenderer);

			// Register the drawing tool with coordinate conversion
			const drawingTool = createDrawingTool(api);

			if (!api.registerTool) {
				throw new Error("api.registerTool is not available");
			}

			api.registerTool(drawingTool);

			// Register the drawing layer component for live drawing (current path only)
			api.registerLayerComponent(() => (
				<DrawingLayer accentColor={api.getAccentColor()} />
			));

			// Register a layer component to render path elements
			api.registerLayerComponent(() => {
				const elements = api.getElements();
				const pathElements = Array.from(elements.values()).filter(
					(element): element is Element => element.type === "drawing-path",
				);

				return (
					<g className="path-elements-layer">
						{pathElements.map((element) => (
							<PathElementRenderer key={element.id} element={element} />
						))}
					</g>
				);
			});
		} catch (error) {
			console.error("Error activating drawing plugin:", error);
		}
	},

	deactivate: () => {
		// Clean up drawing state
		const { clearDrawing } = useDrawingStore.getState();
		clearDrawing();
	},
};

// Export the DrawingLayer for manual integration
export { DrawingLayer };
