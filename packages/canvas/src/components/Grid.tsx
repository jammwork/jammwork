import { CANVAS_CONSTANTS } from "@jammwork/api";

export const Grid = () => {
	return (
		<>
			<defs>
				<pattern
					id="dots"
					width={CANVAS_CONSTANTS.GRID_SIZE}
					height={CANVAS_CONSTANTS.GRID_SIZE}
					patternUnits="userSpaceOnUse"
				>
					<circle
						cx={CANVAS_CONSTANTS.GRID_SIZE / 2}
						cy={CANVAS_CONSTANTS.GRID_SIZE / 2}
						r={CANVAS_CONSTANTS.DOT_SIZE}
						fill={CANVAS_CONSTANTS.COLORS.GRID_DOT}
						opacity={CANVAS_CONSTANTS.DOT_OPACITY}
					/>
				</pattern>
			</defs>
			<rect
				x={CANVAS_CONSTANTS.CANVAS_OFFSET}
				y={CANVAS_CONSTANTS.CANVAS_OFFSET}
				width={CANVAS_CONSTANTS.CANVAS_SIZE}
				height={CANVAS_CONSTANTS.CANVAS_SIZE}
				fill="url(#dots)"
			/></>
	);
};
