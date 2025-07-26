import React from "react";
import { useDrawingStore } from "../store";
import { DRAWING_CONSTANTS } from "../constants";
import type { DrawPath, Position } from "../types";

const pathFromPoints = (points: Position[]): string => {
	if (points.length === 0) return "";

	let path = `M ${points[0].x} ${points[0].y}`;

	if (points.length === 1) {
		// Single point - draw a small line
		return `M ${points[0].x} ${points[0].y} L ${points[0].x + DRAWING_CONSTANTS.SINGLE_POINT_OFFSET} ${points[0].y}`;
	}

	for (let i = 1; i < points.length; i++) {
		path += ` L ${points[i].x} ${points[i].y}`;
	}

	return path;
};

const DrawnPath: React.FC<{ path: DrawPath }> = ({ path }) => (
	<path
		d={pathFromPoints(path.points)}
		stroke={path.color}
		strokeWidth={path.strokeWidth}
		fill="none"
		strokeLinecap="round"
		strokeLinejoin="round"
	/>
);

const CurrentPath: React.FC<{ points: Position[] }> = ({ points }) => {
	if (points.length === 0) return null;

	return (
		<path
			d={pathFromPoints(points)}
			stroke={DRAWING_CONSTANTS.DEFAULT_COLOR}
			strokeWidth={DRAWING_CONSTANTS.DEFAULT_STROKE_WIDTH}
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
			opacity={DRAWING_CONSTANTS.CURRENT_PATH_OPACITY}
		/>
	);
};

export const DrawingLayer: React.FC = React.memo(() => {
	const { isDrawing, currentPath, paths } = useDrawingStore();

	return (
		<g>
			{/* Render completed paths */}
			{paths.map((path) => (
				<DrawnPath key={path.id} path={path} />
			))}

			{/* Render current path being drawn */}
			{isDrawing && currentPath && <CurrentPath points={currentPath} />}
		</g>
	);
});
