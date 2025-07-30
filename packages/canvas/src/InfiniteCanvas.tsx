import type { Plugin } from "@jammwork/api";
import { useEffect, useMemo, useRef } from "react";
import { CanvasContextMenu } from "./components/CanvasContextMenu";
import { CanvasOverlay } from "./components/CanvasOverlay";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { UserCursorsLayer } from "./components/UserCursorsLayer";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useDocumentManager } from "./hooks/useDocumentManager";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePluginSystem } from "./hooks/usePluginSystem";
import { useToolLifecycle } from "./hooks/useToolLifecycle";
import { useViewport } from "./hooks/useViewport";
import { useYjsSync } from "./hooks/useYjsSync";
import { useZoomPrevention } from "./hooks/useZoomPrevention";
import { useCanvasStore } from "./store";

interface InfiniteCanvasProps {
	plugins?: Plugin[];
	accentColor?: string;
	backendUrl: string;
	userId: string;
	userName: string;
	spaceId: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
	plugins = [],
	accentColor = "#3b82f6",
	backendUrl,
	userId,
	userName,
	spaceId,
}) => {
	const svgRef = useRef<SVGSVGElement>(null);

	// Set current user ID in the store for user-specific history tracking
	const setCurrentUserId = useCanvasStore((state) => state.setCurrentUserId);
	const setYjsDocument = useCanvasStore((state) => state.setYjsDocument);
	useEffect(() => {
		if (userId) {
			setCurrentUserId(userId);
		}
	}, [userId, setCurrentUserId]);

	// Document manager - create first to ensure it's available for plugin system
	const documentManager = useDocumentManager({
		backendUrl,
		userId,
		spaceId,
	});

	// Yjs synchronization (only if backend URL and user ID are provided)
	const yjsSync = useYjsSync({
		backendUrl,
		userId,
		userName,
		spaceId,
		accentColor,
	});

	// Set Yjs document in the store after yjsSync is initialized
	useEffect(() => {
		if (yjsSync.mainDocument) {
			setYjsDocument(yjsSync.mainDocument);
		}
	}, [yjsSync.mainDocument, setYjsDocument]);

	const { api, layerComponents, pluginsLoaded } = usePluginSystem({
		plugins,
		accentColor,
		yjsDocumentManager: documentManager,
		mainDocument: yjsSync.mainDocument,
		awareness: yjsSync.awareness,
		userId,
		spaceId,
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

	// Keyboard shortcuts
	useKeyboardShortcuts({ pluginApi: api });

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
	}, [layerComponents, yjsSync.awareness, userId, accentColor]);

	return (
		<div
			className="relative w-full h-screen overflow-hidden bg-background select-none"
			style={containerStyle}
		>
			<CanvasContextMenu pluginApi={api} svgRef={svgRef}>
				<CanvasRenderer
					ref={svgRef}
					dimensions={dimensions}
					viewBoxString={getViewBoxString()}
					cursor={getCursor}
					layerComponents={allLayerComponents}
					pluginApi={api}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseLeave}
					onWheel={handleWheel}
				/>
			</CanvasContextMenu>
			<CanvasOverlay
				pluginApi={api}
				pluginsLoaded={pluginsLoaded}
				awareness={yjsSync.awareness}
				currentUserId={userId}
			/>
		</div>
	);
};
