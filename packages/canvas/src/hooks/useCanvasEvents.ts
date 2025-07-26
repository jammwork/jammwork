import { useCallback, useEffect, type RefObject } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import type { PluginAPI } from "../types/plugin";
import { createSelectTool } from "../tools/SelectTool";

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
	const selectTool = createSelectTool();
	// Keyboard shortcuts for tools
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target !== document.body) return; // Only handle when not in input

			const { setActiveTool, toolState, setSpacePressed } =
				useCanvasStore.getState();

			// Handle space bar for temporary panning
			if (e.code === "Space" && !toolState.isSpacePressed) {
				setSpacePressed(true);
				e.preventDefault();
				return;
			}

			// Don't handle other keys if space is pressed (to allow space+drag panning)
			if (toolState.isSpacePressed) return;

			// First check if the current tool handles the keydown
			if (toolState.activeTool === "select" && selectTool.onKeyDown) {
				selectTool.onKeyDown(e);
				return;
			}

			// Check if any plugin tool handles the keydown
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onKeyDown) {
				activeTool.onKeyDown(e);
				return;
			}

			// Handle tool switching shortcuts
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

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.target !== document.body) return;

			const { setSpacePressed, setSpacePanning } = useCanvasStore.getState();

			// Handle space bar release
			if (e.code === "Space") {
				setSpacePressed(false);
				setSpacePanning(false);
				e.preventDefault();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [selectTool, pluginApi]);

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
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseDown) {
				activeTool.onMouseDown(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "select") {
				selectTool.onMouseDown?.(e.nativeEvent, screenPosition);
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

			// If space panning is active, handle panning
			if (toolState.isSpacePanning) {
				updateDrag({ x: e.clientX, y: e.clientY });
				return;
			}

			// Check if there's an active plugin tool
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseMove) {
				activeTool.onMouseMove(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "select") {
				selectTool.onMouseMove?.(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "pan") {
				updateDrag({ x: e.clientX, y: e.clientY });
			}
		},
		[updateDrag, pluginApi, svgRef, selectTool],
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
			const registeredTools = pluginApi.getRegisteredTools();
			const activeTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === toolState.activeTool,
			);

			if (activeTool?.onMouseUp) {
				activeTool.onMouseUp(e.nativeEvent, screenPosition);
			} else if (toolState.activeTool === "select") {
				selectTool.onMouseUp?.(e.nativeEvent, screenPosition);
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
