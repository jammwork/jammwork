import React from "react";
import { useCanvasStore } from "../canvasStore";
import { SelectionBox } from "./SelectionBox";
import { SelectionIndicator } from "./ResizeHandles";

export const SelectionLayer: React.FC = () => {
	const { selectedElements, hoveredElement } = useCanvasStore(
		(state) => state.selectionState,
	);
	const elements = useCanvasStore((state) => state.elements);
	const zoom = useCanvasStore((state) => state.viewBox.zoom);

	return (
		<g className="selection-layer">
			{/* Selection box */}
			<SelectionBox />

			{/* Hovered element indicator */}
			{hoveredElement &&
				!selectedElements.includes(hoveredElement) &&
				(() => {
					const element = elements.get(hoveredElement);
					return element ? (
						<rect
							x={element.x}
							y={element.y}
							width={element.width}
							height={element.height}
							fill="none"
							stroke="rgba(59, 130, 246, 0.5)"
							strokeWidth={1 / zoom}
							pointerEvents="none"
						/>
					) : null;
				})()}

			{/* Selected elements indicators */}
			{selectedElements.map((elementId) => {
				const element = elements.get(elementId);
				return element ? (
					<SelectionIndicator
						key={elementId}
						element={element}
						zoom={zoom}
						showResizeHandles={true}
					/>
				) : null;
			})}
		</g>
	);
};
