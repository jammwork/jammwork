import type { PluginAPI } from "@jammwork/api";
import React from "react";
import { PositionDisplay } from "./PositionDisplay";
import ThemeToggle from "./ThemeToggle";
import Toolbar from "./Toolbar";

interface CanvasOverlayProps {
	pluginApi: PluginAPI;
	pluginsLoaded: boolean;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = React.memo(
	({ pluginApi, pluginsLoaded }) => {
		return (
			<>
				<PositionDisplay />
				<ThemeToggle />
				{pluginsLoaded && <Toolbar pluginApi={pluginApi} />}
			</>
		);
	},
);
