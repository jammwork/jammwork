import type { Element } from "@jammwork/api";
import type React from "react";

export const TriangleRenderer: React.FC<{ element: Element }> = ({
	element,
}) => {
	const { x, y, width, height, properties } = element;
	const points = properties.points as string;
	const text = properties.text as string;

	return (
		<g>
			<polygon
				points={points}
				fill={(properties.fill as string) || "#3b82f6"}
				stroke={(properties.stroke as string) || "#1e40af"}
				strokeWidth={(properties.strokeWidth as number) || 2}
			/>
			{text && (
				<text
					x={x + width / 2}
					y={y + height / 2}
					textAnchor="middle"
					dominantBaseline="central"
					fill="white"
					fontSize="14"
					fontFamily="Arial, sans-serif"
					pointerEvents="none"
				>
					{text}
				</text>
			)}
		</g>
	);
};
