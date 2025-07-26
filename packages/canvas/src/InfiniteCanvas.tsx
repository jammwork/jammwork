import type { Plugin } from "@jammwork/api";
import { useEffect, useMemo, useRef } from "react";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { usePluginSystem } from "./hooks/usePluginSystem";
import { useViewport } from "./hooks/useViewport";
import { useYjsSync } from "./hooks/useYjsSync";
import { useZoomPrevention } from "./hooks/useZoomPrevention";

interface InfiniteCanvasProps {
	plugins?: Plugin[];
	accentColor?: string;
	backendUrl?: string;
	userId?: string;
	roomId?: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
	plugins = [],
	accentColor = "#3b82f6",
	backendUrl,
	userId,
	roomId,
}) => {
	const svgRef = useRef<SVGSVGElement>(null);

	// Plugin system management
	const { api, layerComponents, pluginsLoaded } = usePluginSystem({
		plugins,
		accentColor,
	});

	// Yjs synchronization (only if backend URL and user ID are provided)
	const yjsSync = useYjsSync({
		backendUrl: backendUrl || "",
		userId: userId || "",
		roomId,
		pluginApi: backendUrl && userId ? api : undefined,
	});

	// Update plugin system with Yjs document manager
	useEffect(() => {
		if (api && yjsSync.documentManager) {
			api.setYjsDocumentManager(yjsSync.documentManager);
		}
	}, [api, yjsSync.documentManager]);

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
