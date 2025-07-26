import React from "react";
import { useCircleCreationStore } from "../stores/circleStore";

interface CirclePreviewProps {
	accentColor?: string;
}

export const CirclePreview: React.FC<CirclePreviewProps> = ({
	accentColor = "#3b82f6",
}) => {
	const { isCreating, startPosition, currentPosition } =
		useCircleCreationStore();

	if (!isCreating || !startPosition || !currentPosition) {
		return null;
	}

	// Calculate ellipse bounds
	const centerX = startPosition.x;
	const centerY = startPosition.y;
	const radiusX = Math.abs(currentPosition.x - startPosition.x);
	const radiusY = Math.abs(currentPosition.y - startPosition.y);

	// Don't render if ellipse is too small
	if (radiusX < 2 || radiusY < 2) {
		return null;
	}

	return (
		<ellipse
			cx={centerX}
			cy={centerY}
			rx={radiusX}
			ry={radiusY}
			fill="transparent"
			stroke={accentColor}
			strokeWidth={2}
			opacity={0.8}
		/>
	);
};
