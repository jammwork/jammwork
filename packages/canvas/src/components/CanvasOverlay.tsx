import React from "react";
import { PositionDisplay } from "./PositionDisplay";
import Toolbar from "./Toolbar";
import type { PluginAPI } from "../plugin";

interface CanvasOverlayProps {
	pluginApi: PluginAPI;
	pluginsLoaded: boolean;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = React.memo(
	({ pluginApi, pluginsLoaded }) => {
		return (
			<>
				<PositionDisplay />
				{pluginsLoaded && <Toolbar pluginApi={pluginApi} />}
			</>
		);
	},
);
