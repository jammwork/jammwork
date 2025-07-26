import { useCallback, useEffect, useMemo } from "react";
import { useCanvasStore } from "@/store";

interface UseViewportProps {
	pluginApi?: {
		getRegisteredTools: () => Map<string, any>;
	};
}

export const useViewport = (props?: UseViewportProps) => {
	const {
		viewBox,
		dragState,
		dimensions,
		toolState,
		setDimensions,
		startDrag,
		updateDrag,
		endDrag,
		zoomAt,
	} = useCanvasStore();

	useEffect(() => {
		const updateDimensions = () => {
			setDimensions(window.innerWidth, window.innerHeight);
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);

		return () => {
			window.removeEventListener("resize", updateDimensions);
		};
	}, [setDimensions]);

	const getViewBoxString = useCallback(() => {
		const viewBoxWidth = dimensions.width / viewBox.zoom;
		const viewBoxHeight = dimensions.height / viewBox.zoom;
		return `${viewBox.x} ${viewBox.y} ${viewBoxWidth} ${viewBoxHeight}`;
	}, [dimensions.width, dimensions.height, viewBox.x, viewBox.y, viewBox.zoom]);

	const getCursor = useMemo(() => {
		// Space panning takes priority
		if (toolState.isSpacePanning) return "grabbing";
		if (toolState.isSpacePressed) return "grab";

		if (dragState.isDragging) return "grabbing";

		// Check for plugin tool cursor
		if (props?.pluginApi) {
			const registeredTools = props.pluginApi.getRegisteredTools();
			const activeTool = registeredTools.get(toolState.activeTool);
			if (activeTool?.cursor) return activeTool.cursor;
		}

		if (toolState.activeTool === "select") return "default";
		if (toolState.activeTool === "pan") return "grab";

		return "default";
	}, [
		dragState.isDragging,
		toolState.activeTool,
		toolState.isSpacePressed,
		toolState.isSpacePanning,
		props?.pluginApi,
	]);

	return {
		viewBox,
		dragState,
		dimensions,
		getViewBoxString,
		getCursor,
		startDrag,
		updateDrag,
		endDrag,
		zoomAt,
	};
};
