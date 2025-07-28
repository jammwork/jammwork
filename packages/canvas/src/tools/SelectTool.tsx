import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { MousePointer } from "lucide-react";
import { useCanvasStore } from "@/store";
import {
	findElementAtPoint,
	findElementsInBounds,
	findResizeHandleAtPoint,
	getSelectionBoxBounds,
} from "../hitTesting";

export const createSelectTool = (api: PluginAPI): ToolDefinition => {
	return {
		id: "select",
		name: "Select",
		icon: <MousePointer size={16} />,
		cursor: "default",

		onActivate: () => {
			// Clear any ongoing operations when select tool is activated
			const { endSelectionBox, endElementDrag, endResize } =
				useCanvasStore.getState();
			endSelectionBox();
			endElementDrag();
			endResize();
		},

		onMouseDown: (event, position) => {
			const state = useCanvasStore.getState();
			const {
				elements,
				selectionState,
				startSelectionBox,
				startElementDrag,
				startResize,
				viewBox,
			} = state;

			// Convert screen position to canvas position
			const canvasPosition = {
				x: viewBox.x + position.x / viewBox.zoom,
				y: viewBox.y + position.y / viewBox.zoom,
			};
			const isMultiSelect = event.ctrlKey || event.metaKey;

			// Check if clicking on a resize handle of a selected element
			for (const selectedId of selectionState.selectedElements) {
				const element = elements.get(selectedId);
				if (element) {
					const resizeHandle = findResizeHandleAtPoint(element, canvasPosition);
					if (resizeHandle) {
						startResize(selectedId, resizeHandle.handle);
						return;
					}
				}
			}

			// Check if clicking on an element
			const clickedElement = findElementAtPoint(elements, canvasPosition);

			if (clickedElement) {
				// If element is already selected, start dragging
				if (selectionState.selectedElements.includes(clickedElement.id)) {
					const offset = {
						x: canvasPosition.x - clickedElement.x,
						y: canvasPosition.y - clickedElement.y,
					};
					startElementDrag(clickedElement.id, offset);
				} else {
					// Select the element
					api.selectElement(clickedElement.id);
				}
			} else {
				// Click on empty space - start selection box or clear selection
				if (!isMultiSelect) {
					api.clearSelection();
				}
				startSelectionBox(canvasPosition);
			}
		},

		onMouseMove: (event, position) => {
			const state = useCanvasStore.getState();
			const {
				selectionState,
				updateSelectionBox,
				updateElementDrag,
				updateResize,
				setHoveredElement,
				elements,
				viewBox,
			} = state;

			// Convert screen position to canvas position
			const canvasPosition = {
				x: viewBox.x + position.x / viewBox.zoom,
				y: viewBox.y + position.y / viewBox.zoom,
			};

			// Update ongoing operations
			if (selectionState.selectionBox?.isActive) {
				updateSelectionBox(canvasPosition);
			} else if (selectionState.draggedElement) {
				updateElementDrag(canvasPosition);
			} else if (selectionState.resizeHandle) {
				updateResize(canvasPosition);
			} else {
				// Update hover state when not dragging
				const hoveredElement = findElementAtPoint(elements, canvasPosition);
				setHoveredElement(hoveredElement?.id || null);
			}
		},

		onMouseUp: (event) => {
			const state = useCanvasStore.getState();
			const {
				selectionState,
				elements,
				endSelectionBox,
				endElementDrag,
				endResize,
			} = state;

			// Handle selection box completion
			if (selectionState.selectionBox?.isActive) {
				const { startX, startY, endX, endY } = selectionState.selectionBox;
				const selectionBounds = getSelectionBoxBounds(
					startX,
					startY,
					endX,
					endY,
				);

				// Only select if the selection box has some size
				if (selectionBounds.width > 2 && selectionBounds.height > 2) {
					const elementsInBounds = findElementsInBounds(
						elements,
						selectionBounds,
					);
					const isMultiSelect = event.ctrlKey || event.metaKey;

					if (!isMultiSelect) {
						// Clear existing selection first
						api.clearSelection();
					}

					// Select all elements in bounds using multi-select to accumulate them
					for (const element of elementsInBounds) {
						state.selectElement(element.id, true);
					}
				}

				endSelectionBox();
			}

			// End other operations
			if (selectionState.draggedElement) {
				// Emit element:updated events for all moved elements before ending drag
				for (const elementId of selectionState.selectedElements) {
					const element = elements.get(elementId);
					if (element) {
						api.emit("element:updated", {
							id: elementId,
							element,
							changes: { x: element.x, y: element.y },
						});
					}
				}
				endElementDrag();
			}

			if (selectionState.resizeHandle) {
				// Emit element:updated event for the resized element
				const element = elements.get(selectionState.resizeHandle.elementId);
				if (element) {
					api.emit("element:updated", {
						id: element.id,
						element,
						changes: {
							x: element.x,
							y: element.y,
							width: element.width,
							height: element.height,
						},
					});
				}
				endResize();
			}
		},

		onDoubleClick: (_event, position) => {
			const state = useCanvasStore.getState();
			const { elements, viewBox } = state;

			// Convert screen position to canvas position
			const canvasPosition = {
				x: viewBox.x + position.x / viewBox.zoom,
				y: viewBox.y + position.y / viewBox.zoom,
			};

			// Find the element at the double-click position
			const clickedElement = findElementAtPoint(elements, canvasPosition);

			if (clickedElement) {
				// Emit a generic element double-click event that plugins can listen to
				api.emit("element:doubleclick", {
					element: clickedElement,
					position: canvasPosition,
					screenPosition: position,
				});
			}
		},

		onKeyDown: (event) => {
			const state = useCanvasStore.getState();

			switch (event.key) {
				case "Delete":
				case "Backspace":
					// Delete selected elements
					for (const selectedId of state.selectionState.selectedElements) {
						api.deleteElement(selectedId);
					}
					break;

				case "Escape":
					// Clear selection and cancel ongoing operations
					api.clearSelection();
					state.endSelectionBox();
					state.endElementDrag();
					state.endResize();
					break;

				case "a":
					if (event.ctrlKey || event.metaKey) {
						// Select all elements
						event.preventDefault();
						api.clearSelection();
						// Get all element IDs and select them directly via store with multi=true
						const elementIds = Array.from(state.elements.keys());
						for (let i = 0; i < elementIds.length; i++) {
							const elementId = elementIds[i];
							// Call store method directly with multi=true to accumulate selections
							state.selectElement(elementId, true);
						}
					}
					break;
			}
		},
	};
};
