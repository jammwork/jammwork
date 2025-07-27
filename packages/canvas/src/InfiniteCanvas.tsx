import type { Plugin } from "@jammwork/api";
import { useMemo, useRef } from "react";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { UserCursorsLayer } from "./components/UserCursorsLayer";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useDocumentManager } from "./hooks/useDocumentManager";
import { usePluginSystem } from "./hooks/usePluginSystem";
import { useToolLifecycle } from "./hooks/useToolLifecycle";
import { useViewport } from "./hooks/useViewport";
import { useYjsSync } from "./hooks/useYjsSync";
import { useZoomPrevention } from "./hooks/useZoomPrevention";

interface InfiniteCanvasProps {
	plugins?: Plugin[];
	accentColor?: string;
	backendUrl: string;
	userId: string;
	roomId: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
	plugins = [],
	accentColor = "#3b82f6",
	backendUrl,
	userId,
	roomId,
}) => {
	const svgRef = useRef<SVGSVGElement>(null);

	// Document manager - create first to ensure it's available for plugin system
	const documentManager = useDocumentManager({
		backendUrl,
		userId,
		roomId,
	});

	// Yjs synchronization (only if backend URL and user ID are provided)
	const yjsSync = useYjsSync({
		backendUrl,
		userId,
		roomId,
	});

	const { api, layerComponents, pluginsLoaded } = usePluginSystem({
		plugins,
		accentColor,
		yjsDocumentManager: documentManager,
		mainDocument: yjsSync.mainDocument,
		userId,
		roomId,
	});

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
		updateCursorPosition: yjsSync.updateCursorPosition,
	});

	// Zoom prevention setup
	useZoomPrevention({ svgRef, zoomAt });

	// Tool lifecycle management
	useToolLifecycle({ pluginApi: api });

	// Memoize container style
	const containerStyle = useMemo(() => ({ touchAction: "none" as const }), []);

	// Combine plugin layers with user cursors layer
	const allLayerComponents = useMemo(() => {
		const layers = [...layerComponents];

		// Add UserCursorsLayer if we have Yjs sync enabled
		if (yjsSync.awareness && userId) {
			layers.push(() => (
				<UserCursorsLayer
					awareness={yjsSync.awareness}
					currentUserId={userId}
				/>
			));
		}

		return layers;
	}, [layerComponents, yjsSync.awareness, userId]);

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
				layerComponents={allLayerComponents}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
			/>
			<CanvasOverlay
				pluginApi={api}
				pluginsLoaded={pluginsLoaded}
			/>
		</div>
	);
};
