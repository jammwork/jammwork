import { useEffect } from "react";
import { useCanvasStore } from "../stores/canvasStore";

export const useViewport = () => {
	const {
		viewBox,
		dragState,
		dimensions,
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

	const getViewBoxString = () => {
		const viewBoxWidth = dimensions.width / viewBox.zoom;
		const viewBoxHeight = dimensions.height / viewBox.zoom;
		return `${viewBox.x} ${viewBox.y} ${viewBoxWidth} ${viewBoxHeight}`;
	};

	const getCursor = () => {
		const { toolState } = useCanvasStore.getState();

		if (dragState.isDragging) return "grabbing";

		if (toolState.activeTool === "select") return "default";
		if (toolState.activeTool === "pan") return "grab";
		if (toolState.activeTool === "draw") return "crosshair";

		return "default";
	};

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
