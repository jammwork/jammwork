import { useCanvasStore } from "../canvasStore";

export const PositionDisplay = () => {
	const { viewBox } = useCanvasStore();

	return (
		<div className="absolute bottom-4 right-4 text-foreground text-xs font-mono bg-muted/80 px-2 py-1 rounded pointer-events-none select-none">
			X: {Math.round(viewBox.x)} Y: {Math.round(viewBox.y)} Zoom:{" "}
			{Math.round(viewBox.zoom * 100)}%
		</div>
	);
};
