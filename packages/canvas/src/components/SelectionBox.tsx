import type React from "react";
import { useCanvasStore } from "@/store";

interface SelectionBoxProps {
	className?: string;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ className }) => {
	const selectionBox = useCanvasStore(
		(state) => state.selectionState.selectionBox,
	);

	if (!selectionBox?.isActive) {
		return null;
	}

	const { startX, startY, endX, endY } = selectionBox;

	const x = Math.min(startX, endX);
	const y = Math.min(startY, endY);
	const width = Math.abs(endX - startX);
	const height = Math.abs(endY - startY);

	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill="rgba(59, 130, 246, 0.1)"
			stroke="rgb(59, 130, 246)"
			strokeWidth="1"
			strokeDasharray="5,5"
			className={className}
			pointerEvents="none"
		/>
	);
};
