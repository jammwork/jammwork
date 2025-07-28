import type { Element } from "@jammwork/api";
import type React from "react";

export const CircleRenderer: React.FC<{ element: Element }> = ({ element }) => {
	const { properties } = element;
	const centerX = properties.centerX as number;
	const centerY = properties.centerY as number;
	const text = properties.text as string;

	// Use radiusX/radiusY if available, fallback to radius for backwards compatibility
	const radiusX =
		(properties.radiusX as number) || (properties.radius as number);
	const radiusY =
		(properties.radiusY as number) || (properties.radius as number);

	// Use ellipse element for better control over independent radii
	return (
		<g>
			<ellipse
				cx={centerX}
				cy={centerY}
				rx={radiusX}
				ry={radiusY}
				fill={(properties.fill as string) || "#3b82f6"}
				stroke={(properties.stroke as string) || "#1e40af"}
				strokeWidth={(properties.strokeWidth as number) || 2}
			/>
			{text && (
				<text
					x={centerX}
					y={centerY}
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
