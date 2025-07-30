import type { PluginAPI } from "@jammwork/api";
import type React from "react";
import { forwardRef, useMemo } from "react";
import { ElementsLayer } from "./ElementsLayer";
import { Grid } from "./Grid";
import { SelectionLayer } from "./SelectionLayer";

interface CanvasRendererProps {
	dimensions: { width: number; height: number };
	viewBoxString: string;
	cursor: string;
	layerComponents: React.ComponentType[];
	pluginApi: PluginAPI;
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
			pluginApi,
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
			// biome-ignore lint/a11y/noSvgWithoutTitle: no title needed
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
				<Grid />

				{/* Built-in elements layer - renders all registered element types */}
				<ElementsLayer pluginApi={pluginApi} />

				{/* Render plugin layers */}
				{layerComponents.map((LayerComponent, index) => (
					<LayerComponent key={`layer-${LayerComponent.name || index}`} />
				))}

				{/* Selection layer - always on top */}
				<SelectionLayer />
			</svg>
		);
	},
);
