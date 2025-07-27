import type { PluginAPI } from "@jammwork/api";
import { type RefObject, useCallback } from "react";
import { useCanvasStore } from "@/store";
import { createSelectTool } from "@/tools/SelectTool";

interface UseCanvasEventsProps {
	svgRef: RefObject<SVGSVGElement | null>;
	pluginApi: PluginAPI;
	startDrag: (position: { x: number; y: number }) => void;
	updateDrag: (position: { x: number; y: number }) => void;
	endDrag: () => void;
	zoomAt: (deltaZoom: number, centerX: number, centerY: number) => void;
	updateCursorPosition?: (x: number, y: number) => void;
}

export const useCanvasEvents = ({
	svgRef,
	pluginApi,
	startDrag,
	updateDrag,
	endDrag,
	zoomAt,
	updateCursorPosition,
}: UseCanvasEventsProps) => {
	const selectTool = pluginApi ? createSelectTool(pluginApi) : null;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const { toolState, setSpacePanning } = useCanvasStore.getState();
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const screenPosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			// If space is pressed, start space panning regardless of current tool
			if (toolState.isSpacePressed) {
				setSpacePanning(true);
				startDrag({ x: e.clientX, y: e.clientY });
				return;
			}

			// Check if there's an active plugin tool
			if (pluginApi) {
				const registeredTools = pluginApi.getRegisteredTools();
				const activeTool = Array.from(registeredTools.values()).find(
					(tool) => tool.id === toolState.activeTool,
				);

				if (activeTool?.onMouseDown) {
					activeTool.onMouseDown(e.nativeEvent, screenPosition);
				} else if (toolState.activeTool === "select") {
					selectTool?.onMouseDown?.(e.nativeEvent, screenPosition);
				} else if (toolState.activeTool === "pan") {
					startDrag({ x: e.clientX, y: e.clientY });
				}
			} else if (toolState.activeTool === "select") {
				selectTool?.onMouseDown?.(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "pan") {
				startDrag({ x: e.clientX, y: e.clientY });
			}
		},
		[startDrag, pluginApi, svgRef, selectTool],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const { toolState } = useCanvasStore.getState();
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const screenPosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			// Update cursor position for collaborative cursors
			if (updateCursorPosition && pluginApi) {
				const canvasPosition = pluginApi.screenToCanvas(screenPosition);
				updateCursorPosition(canvasPosition.x, canvasPosition.y);
			}

			// If space panning is active, handle panning
			if (toolState.isSpacePanning) {
				updateDrag({ x: e.clientX, y: e.clientY });
				return;
			}

			// Check if there's an active plugin tool
			if (pluginApi) {
				const registeredTools = pluginApi.getRegisteredTools();
				const activeTool = Array.from(registeredTools.values()).find(
					(tool) => tool.id === toolState.activeTool,
				);

				if (activeTool?.onMouseMove) {
					activeTool.onMouseMove(e.nativeEvent, screenPosition);
				} else if (toolState.activeTool === "select") {
					selectTool?.onMouseMove?.(e.nativeEvent, screenPosition);
				} else if (toolState.activeTool === "pan") {
					updateDrag({ x: e.clientX, y: e.clientY });
				}
			} else if (toolState.activeTool === "select") {
				selectTool?.onMouseMove?.(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "pan") {
				updateDrag({ x: e.clientX, y: e.clientY });
			}
		},
		[updateDrag, pluginApi, svgRef, selectTool, updateCursorPosition],
	);

	const handleMouseUp = useCallback(
		(e: React.MouseEvent) => {
			const { toolState, setSpacePanning } = useCanvasStore.getState();
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const screenPosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			// If space panning was active, end it
			if (toolState.isSpacePanning) {
				setSpacePanning(false);
				endDrag();
				return;
			}

			// Check if there's an active plugin tool
			if (pluginApi) {
				const registeredTools = pluginApi.getRegisteredTools();
				const activeTool = Array.from(registeredTools.values()).find(
					(tool) => tool.id === toolState.activeTool,
				);

				if (activeTool?.onMouseUp) {
					activeTool.onMouseUp(e.nativeEvent, screenPosition);
				} else if (toolState.activeTool === "select") {
					selectTool?.onMouseUp?.(e.nativeEvent, screenPosition);
				} else {
					endDrag();
				}
			} else if (toolState.activeTool === "select") {
				selectTool?.onMouseUp?.(e.nativeEvent, screenPosition);
			} else {
				endDrag();
			}
		},
		[endDrag, pluginApi, svgRef, selectTool],
	);

	const handleMouseLeave = useCallback(() => {
		endDrag();
	}, [endDrag]);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const centerX = e.clientX - rect.left;
			const centerY = e.clientY - rect.top;

			// Detect pinch gesture (ctrlKey is set during pinch on trackpad)
			if (e.ctrlKey) {
				// Pinch gesture - use deltaY directly but with different scaling
				zoomAt(-e.deltaY * 2, centerX, centerY);
			} else {
				// Regular scroll - use deltaY
				zoomAt(-e.deltaY, centerX, centerY);
			}
		},
		[zoomAt, svgRef],
	);

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		handleWheel,
	};
};
