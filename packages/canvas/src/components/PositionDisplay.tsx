import { useCanvasStore } from "@/store";

export const PositionDisplay = () => {
	const { viewBox } = useCanvasStore();

	return (
		<div className="absolute bottom-2 right-2 z-10 font-mono text-[10px] opacity-80 space-x-3">
			<span>X: {Math.round(viewBox.x)}</span>
			<span>Y: {Math.round(viewBox.y)}</span>
			<span>Zoom: {Math.round(viewBox.zoom * 100)}%</span>
		</div>
	);
};
