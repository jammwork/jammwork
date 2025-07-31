import type { Plugin, PluginAPI } from "@jammwork/api";
import React from "react";
import type { Awareness } from "y-protocols/awareness";
import { MemberList } from "./MemberList";
import { PluginManager } from "./PluginManager";
import { PositionDisplay } from "./PositionDisplay";
import ThemeToggle from "./ThemeToggle";
import Toolbar from "./Toolbar";

interface CanvasOverlayProps {
	pluginApi: PluginAPI;
	pluginsLoaded: boolean;
	awareness?: Awareness;
	currentUserId?: string;
	backendUrl: string;
	spaceId: string;
	plugins: Plugin[];
	availablePlugins: Plugin[];
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = React.memo(
	({
		pluginApi,
		pluginsLoaded,
		awareness,
		currentUserId,
		backendUrl,
		spaceId,
		plugins,
		availablePlugins,
	}) => {
		const topRightMenuItems = pluginsLoaded
			? pluginApi.getMenuItems("top-right")
			: [];

		const handlePluginsUpdated = () => {
			// The page will reload automatically when plugins are updated
			// This callback could be used for other state management if needed
		};

		return (
			<>
				<PositionDisplay />
				<div className="absolute top-2 right-2 z-10 flex items-center gap-2">
					{topRightMenuItems.map((item) => {
						const Component = item.component;
						return <Component key={item.id} />;
					})}
					{awareness && currentUserId && (
						<MemberList awareness={awareness} currentUserId={currentUserId} />
					)}
					<PluginManager
						backendUrl={backendUrl}
						spaceId={spaceId}
						currentPlugins={plugins.map((plugin) => plugin.id)}
						availablePlugins={availablePlugins}
						onPluginsUpdated={handlePluginsUpdated}
					/>
					<ThemeToggle />
				</div>
				{pluginsLoaded && <Toolbar pluginApi={pluginApi} />}
			</>
		);
	},
);
