import type { PluginAPI } from "@jammwork/api";
import React from "react";
import { useCanvasStore } from "@/store";

interface PinnedElementsLayerProps {
	api: PluginAPI;
}

export const PinnedElementsLayer: React.FC<PinnedElementsLayerProps> = ({
	api,
}) => {
	const { pinnedElements } = useCanvasStore((state) => state.pinningState);

	// Get registered element renderers from the API
	const elementRenderers = api.getRegisteredElementTypes();

	return (
		<div
			className="pinned-elements-overlay"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				pointerEvents: "none",
				zIndex: 1000,
				width: "100vw",
				height: "100vh",
			}}
		>
			{Array.from(pinnedElements.values()).map((pinnedElement) => {
				const renderer = elementRenderers.get(pinnedElement.element.type);
				if (!renderer) return null;

				// Create a modified element with position reset to 0,0 since we're positioning the container
				const elementForRendering = {
					...pinnedElement.element,
					x: 0,
					y: 0,
				};

				return (
					<div
						key={pinnedElement.id}
						style={{
							position: "absolute",
							left: pinnedElement.screenX,
							top: pinnedElement.screenY,
							pointerEvents: "auto",
						}}
					>
						<svg
							width={pinnedElement.element.width}
							height={pinnedElement.element.height}
							style={{ overflow: "visible" }}
						>
							{renderer.render(elementForRendering, {
								zoom: 1, // Always render at 1:1 scale since we're in screen space
								selected: false, // Pinned elements are not part of canvas selection
								hovered: false,
							})}
						</svg>
					</div>
				);
			})}
		</div>
	);
};
