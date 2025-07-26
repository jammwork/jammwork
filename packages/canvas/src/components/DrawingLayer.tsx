import { useCanvasStore } from "../stores/canvasStore";
import type { DrawPath, Position } from "../stores/canvasStore";

const pathFromPoints = (points: Position[]): string => {
	if (points.length === 0) return "";

	let path = `M ${points[0].x} ${points[0].y}`;

	if (points.length === 1) {
		// Single point - draw a small circle
		return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
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
			stroke="#000000"
			strokeWidth={2}
			fill="none"
			strokeLinecap="round"
			strokeLinejoin="round"
			opacity={0.8}
		/>
	);
};

export const DrawingLayer: React.FC = () => {
	const { drawState } = useCanvasStore();

	return (
		<g>
			{/* Render completed paths */}
			{drawState.paths.map((path) => (
				<DrawnPath key={path.id} path={path} />
			))}

			{/* Render current path being drawn */}
			{drawState.isDrawing && drawState.currentPath && (
				<CurrentPath points={drawState.currentPath} />
			)}
		</g>
	);
};
