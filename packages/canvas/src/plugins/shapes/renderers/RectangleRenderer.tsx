import type React from "react";
import type { Element } from "../../../plugin";

export const RectangleRenderer: React.FC<{ element: Element }> = ({
	element,
}) => {
	const { x, y, width, height, properties } = element;

	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill={(properties.fill as string) || "#3b82f6"}
			stroke={(properties.stroke as string) || "#1e40af"}
			strokeWidth={(properties.strokeWidth as number) || 2}
		/>
	);
};
