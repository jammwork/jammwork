import type { Element, PluginAPI } from "@jammwork/api";
import React from "react";
import { useMindmapStore } from "./store";

interface ConnectionHandlesProps {
	element: Element;
	api: PluginAPI;
}

export const ConnectionHandles: React.FC<ConnectionHandlesProps> = React.memo(
	({ element, api }) => {
		const { addConnection, updateNodeHierarchy } = useMindmapStore();

		const handleSize = 12;
		const handleOffset = 6;

		const getConnectionPoint = (side: "left" | "right") => {
			switch (side) {
				case "left":
					return { x: -handleOffset, y: element.height / 2 };
				case "right":
					return { x: element.width + handleOffset, y: element.height / 2 };
			}
		};

		const createNodeOnSide = (side: "left" | "right") => {
			console.log(`Creating node on ${side} side of element:`, element.id);

			// Initialize current node in hierarchy if not exists
			const store = useMindmapStore.getState();
			if (!store.nodeHierarchy.get(element.id)) {
				store.updateNodeHierarchy(element.id, null, null);
			}

			// Use automatic positioning for new node
			const positionOffsets = store.calculateNodePosition(element.id, api);
			const newX = element.x + positionOffsets.horizontalOffset;
			const newY = element.y + positionOffsets.verticalOffset;

			// Create new node
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

			// Add connection and update hierarchy with full reorganization
			addConnection(element.id, newNodeId, side, api);

			// Auto-select the new node
			api.clearSelection();
			api.selectElement(newNodeId);

			return newNodeId;
		};

		const handleClick = (side: "left" | "right", e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			createNodeOnSide(side);
		};

		const renderHandle = (side: "left" | "right") => {
			const position = getConnectionPoint(side);
			const childrenOnSide = useMindmapStore
				.getState()
				.getChildrenOnSide(element.id, side);
			const hasChildren = childrenOnSide.length > 0;

			return (
				<g key={side}>
					{/* Connection line to indicate side */}
					<line
						x1={position.x}
						y1={position.y}
						x2={position.x + (side === "left" ? -15 : 15)}
						y2={position.y}
						stroke="#3b82f6"
						strokeWidth="2"
						opacity={hasChildren ? 0.3 : 0.7}
					/>

					{/* Clickable handle */}
					<circle
						cx={position.x}
						cy={position.y}
						r={handleSize / 2}
						fill={hasChildren ? "#10b981" : "#3b82f6"}
						stroke="#ffffff"
						strokeWidth="2"
						style={{ cursor: "pointer" }}
						onClick={(e) => handleClick(side, e)}
						className="connection-handle"
					/>

					{/* Plus icon */}
					<g transform={`translate(${position.x}, ${position.y})`}>
						<line x1={-3} y1={0} x2={3} y2={0} stroke="white" strokeWidth="2" />
						<line x1={0} y1={-3} x2={0} y2={3} stroke="white" strokeWidth="2" />
					</g>
				</g>
			);
		};

		return <g>{renderHandle("right")}</g>;
	},
);
