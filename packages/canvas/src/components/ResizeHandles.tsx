import type { Element } from "@jammwork/api";
import { getResizeHandles } from "@/hitTesting";

interface ResizeHandlesProps {
	element: Element;
	zoom: number;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
	element,
	zoom,
}) => {
	const handleSize = Math.max(6, 8 / zoom); // Scale handles with zoom but keep minimum size
	const handles = getResizeHandles(element, handleSize);

	return (
		<g className="resize-handles">
			{handles.map((handle) => (
				<rect
					key={handle.handle}
					x={handle.bounds.x}
					y={handle.bounds.y}
					width={handle.bounds.width}
					height={handle.bounds.height}
					fill="white"
					stroke="rgb(59, 130, 246)"
					strokeWidth={1 / zoom}
					className="resize-handle"
					data-handle={handle.handle}
					style={{ cursor: handle.cursor }}
				/>
			))}
		</g>
	);
};

interface SelectionIndicatorProps {
	element: Element;
	zoom: number;
	showResizeHandles?: boolean;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
	element,
	zoom,
	showResizeHandles = true,
}) => {
	const strokeWidth = 1 / zoom;

	return (
		<g className="selection-indicator">
			{/* Selection outline */}
			<rect
				x={element.x}
				y={element.y}
				width={element.width}
				height={element.height}
				fill="none"
				stroke="rgb(59, 130, 246)"
				strokeWidth={strokeWidth}
				strokeDasharray={`${3 / zoom},${3 / zoom}`}
				pointerEvents="none"
			/>

			{/* Resize handles */}
			{showResizeHandles && <ResizeHandles element={element} zoom={zoom} />}
		</g>
	);
};
