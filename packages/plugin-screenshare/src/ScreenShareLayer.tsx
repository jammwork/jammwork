import type { PluginAPI } from "@jammwork/api";
import type React from "react";
import { ScreenShareRenderer } from "./ScreenShareRenderer";

interface ScreenShareLayerProps {
	api: PluginAPI;
}

export const ScreenShareLayer: React.FC<ScreenShareLayerProps> = ({ api }) => {
	const elements = api.getElements();
	const screenshareElements = Array.from(elements.values()).filter(
		(element) => element.type === "screenshare",
	);

	return (
		<g className="screenshare-elements-layer">
			{screenshareElements.map((element) => (
				<ScreenShareRenderer key={element.id} element={element} />
			))}
		</g>
	);
};
