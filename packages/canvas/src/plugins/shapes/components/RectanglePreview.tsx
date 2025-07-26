import React from "react";
import { useRectangleCreationStore } from "../store";

interface RectanglePreviewProps {
	accentColor?: string;
}

export const RectanglePreview: React.FC<RectanglePreviewProps> = ({
	accentColor = "#3b82f6",
}) => {
	const { isCreating, startPosition, currentPosition } =
		useRectangleCreationStore();

	if (!isCreating || !startPosition || !currentPosition) {
		return null;
	}

	// Calculate rectangle bounds
	const x = Math.min(startPosition.x, currentPosition.x);
	const y = Math.min(startPosition.y, currentPosition.y);
	const width = Math.abs(currentPosition.x - startPosition.x);
	const height = Math.abs(currentPosition.y - startPosition.y);

	// Don't render if rectangle is too small
	if (width < 2 || height < 2) {
		return null;
	}

	return (
		<rect
			x={x}
			y={y}
			width={width}
			height={height}
			fill="transparent"
			stroke={accentColor}
			strokeWidth={2}
			opacity={0.8}
		/>
	);
};
