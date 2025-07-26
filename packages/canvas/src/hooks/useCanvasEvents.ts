import { useCallback, useEffect, RefObject } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import type { PluginAPI } from "../types/plugin";

interface UseCanvasEventsProps {
	svgRef: RefObject<SVGSVGElement | null>;
	pluginApi: PluginAPI;
	startDrag: (position: { x: number; y: number }) => void;
	updateDrag: (position: { x: number; y: number }) => void;
	endDrag: () => void;
	zoomAt: (deltaZoom: number, centerX: number, centerY: number) => void;
}

export const useCanvasEvents = ({
	svgRef,
	pluginApi,
	startDrag,
	updateDrag,
	endDrag,
	zoomAt,
}: UseCanvasEventsProps) => {
	// Keyboard shortcuts for tools
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target !== document.body) return; // Only handle when not in input

			const { setActiveTool } = useCanvasStore.getState();

			switch (e.key.toLowerCase()) {
				case "v":
					setActiveTool("select");
					e.preventDefault();
					break;
				case "h":
					setActiveTool("pan");
					e.preventDefault();
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const { toolState } = useCanvasStore.getState();
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const screenPosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			// Check if there's an active plugin tool
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseDown) {
				activeTool.onMouseDown(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "pan") {
				startDrag({ x: e.clientX, y: e.clientY });
			} else if (toolState.activeTool === "select") {
				// TODO: Handle element selection
				console.log("Select tool - implement element selection logic");
			}
		},
		[startDrag, pluginApi, svgRef],
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

			// Check if there's an active plugin tool
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseMove) {
				activeTool.onMouseMove(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "pan") {
				updateDrag({ x: e.clientX, y: e.clientY });
			} else if (toolState.activeTool === "select") {
				// TODO: Handle element hover/selection feedback
			}
		},
		[updateDrag, pluginApi, svgRef],
	);

	const handleMouseUp = useCallback(
		(e: React.MouseEvent) => {
			const { toolState } = useCanvasStore.getState();
			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const screenPosition = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			// Check if there's an active plugin tool
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseUp) {
				activeTool.onMouseUp(e.nativeEvent, screenPosition);
			} else {
				endDrag();
			}
		},
		[endDrag, pluginApi, svgRef],
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
