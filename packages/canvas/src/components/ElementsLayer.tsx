import type { PluginAPI } from "@jammwork/api";
import React from "react";
import { useCanvasStore } from "@/store";

interface ElementsLayerProps {
	pluginApi: PluginAPI;
}

/**
 * Built-in layer that automatically renders all elements using their registered element type renderers.
 * This eliminates the need for plugins to manually register layer components for basic element rendering.
 */
export const ElementsLayer: React.FC<ElementsLayerProps> = React.memo(
	({ pluginApi }) => {
		// Use Zustand store directly for reactive updates
		const elements = useCanvasStore((state) => state.elements);
		const selectedElements = useCanvasStore(
			(state) => state.selectionState.selectedElements,
		);
		const zoom = useCanvasStore((state) => state.viewBox.zoom);

		// Get registered element types from the plugin API
		const registeredElementTypes = pluginApi.getRegisteredElementTypes();

		return (
			<g className="elements-layer">
				{Array.from(elements.values()).map((element) => {
					const elementRenderer = registeredElementTypes.get(element.type);

					if (!elementRenderer || !elementRenderer.render) {
						// Skip elements that don't have a registered renderer
						return null;
					}

					const renderContext = {
						zoom: zoom,
						selected: selectedElements.includes(element.id),
						hovered: false, // TODO: Add hover state tracking
					};

					return (
						<React.Fragment key={element.id}>
							{elementRenderer.render(element, renderContext)}
						</React.Fragment>
					);
				})}
			</g>
		);
	},
);
