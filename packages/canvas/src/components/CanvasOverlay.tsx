import type { PluginAPI } from "@jammwork/api";
import React from "react";
import type { Awareness } from "y-protocols/awareness";
import { MemberList } from "./MemberList";
import { PositionDisplay } from "./PositionDisplay";
import ThemeToggle from "./ThemeToggle";
import Toolbar from "./Toolbar";

interface CanvasOverlayProps {
	pluginApi: PluginAPI;
	pluginsLoaded: boolean;
	awareness?: Awareness;
	currentUserId?: string;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = React.memo(
	({ pluginApi, pluginsLoaded, awareness, currentUserId }) => {
		return (
			<>
				<PositionDisplay />
				<div className="absolute top-2 right-2 z-10 flex items-center gap-2">
					{awareness && currentUserId && (
						<MemberList awareness={awareness} currentUserId={currentUserId} />
					)}
					<ThemeToggle />
				</div>
				{pluginsLoaded && <Toolbar pluginApi={pluginApi} />}
			</>
		);
	},
);
