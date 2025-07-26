import React, { forwardRef, useMemo } from "react";
import { CANVAS_CONSTANTS } from "@/constants";

interface CanvasRendererProps {
	dimensions: { width: number; height: number };
	viewBoxString: string;
	cursor: string;
	layerComponents: React.ComponentType[];
	onMouseDown: (e: React.MouseEvent) => void;
	onMouseMove: (e: React.MouseEvent) => void;
	onMouseUp: (e: React.MouseEvent) => void;
	onMouseLeave: () => void;
	onWheel: (e: React.WheelEvent) => void;
}

export const CanvasRenderer = forwardRef<
	SVGSVGElement | null,
	CanvasRendererProps
>(
	(
		{
			dimensions,
			viewBoxString,
			cursor,
			layerComponents,
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onMouseLeave,
			onWheel,
		},
		ref,
	) => {
		// Memoize the cursor style to prevent re-renders
		const cursorStyle = useMemo(() => ({ cursor }), [cursor]);

		return (
			<svg
				ref={ref}
				width={dimensions.width}
				height={dimensions.height}
				viewBox={viewBoxString}
				className="bg-background"
				style={cursorStyle}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
				onMouseLeave={onMouseLeave}
				onWheel={onWheel}
			>
				<title>Infinite Canvas</title>
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
				/>
				{/* Render plugin layers */}
				{layerComponents.map((LayerComponent, index) => (
					<LayerComponent key={`layer-${LayerComponent.name || index}`} />
				))}
			</svg>
		);
	},
);
