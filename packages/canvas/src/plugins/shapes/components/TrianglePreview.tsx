import React from "react";
import { useTriangleCreationStore } from "../stores/triangleStore";

interface TrianglePreviewProps {
	accentColor?: string;
}

export const TrianglePreview: React.FC<TrianglePreviewProps> = ({
	accentColor = "#3b82f6",
}) => {
	const { isCreating, startPosition, currentPosition } =
		useTriangleCreationStore();

	if (!isCreating || !startPosition || !currentPosition) {
		return null;
	}

	// Calculate triangle bounds
	const x = Math.min(startPosition.x, currentPosition.x);
	const y = Math.min(startPosition.y, currentPosition.y);
	const width = Math.abs(currentPosition.x - startPosition.x);
	const height = Math.abs(currentPosition.y - startPosition.y);

	// Don't render if triangle is too small
	if (width < 2 || height < 2) {
		return null;
	}

	// Create triangle points (equilateral-ish triangle within the bounding box)
	const centerX = x + width / 2;
	const topY = y;
	const bottomY = y + height;
	const leftX = x;
	const rightX = x + width;

	const points = `${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`;

	return (
		<polygon
			points={points}
			fill="transparent"
			stroke={accentColor}
			strokeWidth={2}
			opacity={0.8}
		/>
	);
};
