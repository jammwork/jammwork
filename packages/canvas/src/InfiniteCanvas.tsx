import { useRef, useMemo } from "react";
import { useViewport } from "./hooks/useViewport";
import { usePluginSystem } from "./hooks/usePluginSystem";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useZoomPrevention } from "./hooks/useZoomPrevention";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { CanvasOverlay } from "./components/CanvasOverlay";
import type { Plugin } from "./types/plugin";

interface InfiniteCanvasProps {
	plugins?: Plugin[];
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
	plugins = [],
}) => {
	const svgRef = useRef<SVGSVGElement>(null);

	// Plugin system management
	const { api, layerComponents, pluginsLoaded } = usePluginSystem({ plugins });

	// Viewport and canvas state
	const {
		dimensions,
		getViewBoxString,
		getCursor,
		startDrag,
		updateDrag,
		endDrag,
		zoomAt,
	} = useViewport({ pluginApi: api });

	// Mouse and keyboard event handlers
	const {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleMouseLeave,
		handleWheel,
	} = useCanvasEvents({
		svgRef,
		pluginApi: api,
		startDrag,
		updateDrag,
		endDrag,
		zoomAt,
	});

	// Zoom prevention setup
	useZoomPrevention({ svgRef, zoomAt });

	// Memoize container style
	const containerStyle = useMemo(() => ({ touchAction: "none" as const }), []);

	return (
		<div
			className="relative w-full h-screen overflow-hidden bg-background"
			style={containerStyle}
		>
			<CanvasRenderer
				ref={svgRef}
				dimensions={dimensions}
				viewBoxString={getViewBoxString()}
				cursor={getCursor}
				layerComponents={layerComponents}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
			/>
			<CanvasOverlay pluginApi={api} pluginsLoaded={pluginsLoaded} />
		</div>
	);
};
