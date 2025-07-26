import type { Element } from "@jammwork/api";
import type React from "react";

export const TriangleRenderer: React.FC<{ element: Element }> = ({
	element,
}) => {
	const { properties } = element;
	const points = properties.points as string;

	return (
		<polygon
			points={points}
			fill={(properties.fill as string) || "#3b82f6"}
			stroke={(properties.stroke as string) || "#1e40af"}
			strokeWidth={(properties.strokeWidth as number) || 2}
		/>
	);
};
