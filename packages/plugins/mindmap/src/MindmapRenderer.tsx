import type { Element, PluginAPI } from "@jammwork/api";
import React, { useEffect, useRef, useState } from "react";
import { useMindmapStore } from "./store";
import { ConnectionHandles } from "./ConnectionHandles";

interface MindmapRendererProps {
	element: Element;
	api: PluginAPI;
}

export const MindmapRenderer: React.FC<MindmapRendererProps> = React.memo(
	({ element, api }) => {
		const [isEditing, setIsEditing] = useState(false);
		const [text, setText] = useState(
			(element.properties?.text as string) || "New Node",
		);
		const inputRef = useRef<HTMLInputElement>(null);

		const { addConnection } = useMindmapStore();

		useEffect(() => {
			setText((element.properties?.text as string) || "New Node");
		}, [element.properties?.text]);

		useEffect(() => {
			if (isEditing && inputRef.current) {
				inputRef.current.focus();
				inputRef.current.select();
			}
		}, [isEditing]);

		const handleDoubleClick = () => {
			setIsEditing(true);
		};

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setText(e.target.value);
		};

		const saveText = () => {
			api.updateElement(element.id, {
				properties: {
					...element.properties,
					text: text,
				},
			});

			setIsEditing(false);
		};

		const handleInputBlur = () => {
			saveText();
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				// Enter: Create sibling node (same level)
				e.preventDefault();
				saveText();
				createConnectedNode("sibling");
			} else if (e.key === "Tab") {
				// Tab: Create child node
				e.preventDefault();
				saveText();
				createConnectedNode("child");
			} else if (e.key === "Escape") {
				// Cancel editing and revert to original text
				setText((element.properties?.text as string) || "New Node");
				setIsEditing(false);
			}
		};

		const createConnectedNode = (type: "child" | "sibling") => {
			console.log(`Creating ${type} node for element:`, element.id);

			// Initialize current node in hierarchy if not exists
			const store = useMindmapStore.getState();
			if (!store.nodeHierarchy.get(element.id)) {
				store.updateNodeHierarchy(element.id, null, null);
			}

			if (type === "child") {
				// Use automatic positioning for child nodes
				const positionOffsets = store.calculateNodePosition(element.id, api);
				const newX = element.x + positionOffsets.horizontalOffset;
				const newY = element.y + positionOffsets.verticalOffset;

				const newElement = {
					type: "mindmap",
					x: newX,
					y: newY,
					width: 120,
					height: 40,
					properties: {
						text: "New Node",
					},
				};

				const newNodeId = api.createElement(newElement);
				addConnection(element.id, newNodeId, "right", api);

				// Auto-select the new node
				api.clearSelection();
				api.selectElement(newNodeId);
			} else {
				// Create sibling - need to find parent and add as its child
				const hierarchy = store.nodeHierarchy.get(element.id);
				console.log("Current node hierarchy:", hierarchy);

				if (hierarchy?.parentId) {
					const parentElement = Array.from(
						api.getCanvasState().elements.values(),
					).find((el) => el.id === hierarchy.parentId);

					if (parentElement) {
						const side = hierarchy.side || "right";

						// Use automatic positioning for sibling nodes
						const positionOffsets = store.calculateNodePosition(
							hierarchy.parentId,
							api,
						);
						const newX = parentElement.x + positionOffsets.horizontalOffset;
						const newY = parentElement.y + positionOffsets.verticalOffset;

						const newElement = {
							type: "mindmap",
							x: newX,
							y: newY,
							width: 120,
							height: 40,
							properties: {
								text: "New Node",
							},
						};

						const newNodeId = api.createElement(newElement);
						addConnection(hierarchy.parentId, newNodeId, side, api);

						// Auto-select the new node
						api.clearSelection();
						api.selectElement(newNodeId);
					} else {
						console.log("Parent element not found for:", hierarchy.parentId);
					}
				} else {
					console.log("No parent found, creating child instead");
					// If no parent, create as child
					createConnectedNode("child");
				}
			}
		};

		// Check if this element is selected
		const selectedElements = api.getSelectedElements();
		const isSelected = selectedElements.includes(element.id);

		// Check if this element is a potential drop target
		const nearbyNode = useMindmapStore((state) => state.nearbyNode);
		const isDragging = useMindmapStore((state) => state.isDragging);
		const draggedNodeId = useMindmapStore((state) => state.draggedNodeId);

		const isDropTarget =
			isDragging &&
			nearbyNode?.nodeId === element.id &&
			draggedNodeId !== element.id;

		// Debug logging for drop target detection (reduced spam)
		if (isDragging && isDropTarget) {
			console.log(
				`🎯 DROP TARGET: Element ${element.id} highlighted (nearbyNode=${nearbyNode?.nodeId}, side=${nearbyNode?.side})`,
			);
		}

		return (
			<g transform={`translate(${element.x}, ${element.y})`}>
				{/* Background rectangle */}
				{/** biome-ignore lint/a11y/noStaticElementInteractions: no need */}
				<rect
					width={element.width}
					height={element.height}
					fill="#000000"
					stroke={isDropTarget ? "#22c55e" : isSelected ? "#3b82f6" : "#2563eb"}
					strokeWidth={isDropTarget || isSelected ? "3" : "2"}
					rx="8"
					onDoubleClick={handleDoubleClick}
				/>

				{/* Drop target indicator */}
				{isDropTarget && nearbyNode && (
					<g>
						{/* Highlight the connection point */}
						<circle
							cx={nearbyNode.side === "left" ? 0 : element.width}
							cy={element.height / 2}
							r="8"
							fill="#22c55e"
							opacity="0.7"
						/>
					</g>
				)}

				{/* Text content using foreignObject for HTML */}
				<foreignObject
					width={element.width}
					height={element.height}
					style={{ pointerEvents: isEditing ? "auto" : "none" }}
				>
					<div className="flex items-center justify-center w-full h-full p-1">
						{isEditing ? (
							<input
								ref={inputRef}
								type="text"
								value={text}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								onKeyDown={handleKeyDown}
								className="w-full text-sm font-bold text-center text-blue-600 bg-transparent border-none outline-none"
							/>
						) : (
							<span className="text-sm font-bold text-center text-blue-600 break-words">
								{text}
							</span>
						)}
					</div>
				</foreignObject>

				{/* Show connection handles when selected */}
				{isSelected && <ConnectionHandles element={element} api={api} />}
			</g>
		);
	},
);
