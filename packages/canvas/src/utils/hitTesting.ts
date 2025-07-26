import type { Element } from "../types/plugin";

export interface Point {
	x: number;
	y: number;
}

export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function pointInBounds(point: Point, bounds: Bounds): boolean {
	return (
		point.x >= bounds.x &&
		point.x <= bounds.x + bounds.width &&
		point.y >= bounds.y &&
		point.y <= bounds.y + bounds.height
	);
}

export function boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
	return !(
		bounds1.x + bounds1.width < bounds2.x ||
		bounds2.x + bounds2.width < bounds1.x ||
		bounds1.y + bounds1.height < bounds2.y ||
		bounds2.y + bounds2.height < bounds1.y
	);
}

export function getElementBounds(element: Element): Bounds {
	return {
		x: element.x,
		y: element.y,
		width: element.width,
		height: element.height,
	};
}

export function getSelectionBoxBounds(
	startX: number,
	startY: number,
	endX: number,
	endY: number,
): Bounds {
	return {
		x: Math.min(startX, endX),
		y: Math.min(startY, endY),
		width: Math.abs(endX - startX),
		height: Math.abs(endY - startY),
	};
}

export function findElementAtPoint(
	elements: Map<string, Element>,
	point: Point,
): Element | null {
	const elementsArray = Array.from(elements.values());

	// Check from top to bottom (last drawn elements are on top)
	for (let i = elementsArray.length - 1; i >= 0; i--) {
		const element = elementsArray[i];
		if (pointInBounds(point, getElementBounds(element))) {
			return element;
		}
	}

	return null;
}

export function findElementsInBounds(
	elements: Map<string, Element>,
	bounds: Bounds,
): Element[] {
	const result: Element[] = [];

	for (const element of elements.values()) {
		if (boundsIntersect(getElementBounds(element), bounds)) {
			result.push(element);
		}
	}

	return result;
}

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export interface ResizeHandleInfo {
	handle: ResizeHandle;
	bounds: Bounds;
	cursor: string;
}

export function getResizeHandles(
	element: Element,
	handleSize = 8,
): ResizeHandleInfo[] {
	const { x, y, width, height } = element;
	const halfHandle = handleSize / 2;

	return [
		{
			handle: "nw",
			bounds: {
				x: x - halfHandle,
				y: y - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "nw-resize",
		},
		{
			handle: "ne",
			bounds: {
				x: x + width - halfHandle,
				y: y - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "ne-resize",
		},
		{
			handle: "sw",
			bounds: {
				x: x - halfHandle,
				y: y + height - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "sw-resize",
		},
		{
			handle: "se",
			bounds: {
				x: x + width - halfHandle,
				y: y + height - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "se-resize",
		},
		{
			handle: "n",
			bounds: {
				x: x + width / 2 - halfHandle,
				y: y - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "n-resize",
		},
		{
			handle: "s",
			bounds: {
				x: x + width / 2 - halfHandle,
				y: y + height - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "s-resize",
		},
		{
			handle: "e",
			bounds: {
				x: x + width - halfHandle,
				y: y + height / 2 - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "e-resize",
		},
		{
			handle: "w",
			bounds: {
				x: x - halfHandle,
				y: y + height / 2 - halfHandle,
				width: handleSize,
				height: handleSize,
			},
			cursor: "w-resize",
		},
	];
}

export function findResizeHandleAtPoint(
	element: Element,
	point: Point,
	handleSize = 8,
): ResizeHandleInfo | null {
	const handles = getResizeHandles(element, handleSize);

	for (const handle of handles) {
		if (pointInBounds(point, handle.bounds)) {
			return handle;
		}
	}

	return null;
}
