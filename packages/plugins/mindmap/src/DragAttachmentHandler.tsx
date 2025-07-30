import type { Element, PluginAPI } from "@jammwork/api";
import React, { useEffect } from "react";
import { useMindmapStore } from "./store";

interface DragAttachmentHandlerProps {
	api: PluginAPI;
}

export const DragAttachmentHandler: React.FC<DragAttachmentHandlerProps> =
	React.memo(({ api }) => {
		const { setIsDragging, setDraggedNode, setNearbyNode, reconnectNode } =
			useMindmapStore();

		useEffect(() => {
			let isMouseDown = false;
			let dragStartPos: { x: number; y: number } | null = null;
			let isDragMode = false;
			let currentDraggedNodeId: string | null = null;

			const checkForNearbyNodes = (e: MouseEvent) => {
				if (!currentDraggedNodeId) return;

				const canvasPos = api.screenToCanvas({ x: e.clientX, y: e.clientY });
				const elements = api.getCanvasState().elements;
				const threshold = 120;

				let closestNode: {
					nodeId: string;
					side: "left" | "right";
					distance: number;
				} | null = null;

				Array.from(elements.values()).forEach((element) => {
					if (
						element.type === "mindmap" &&
						element.id !== currentDraggedNodeId
					) {
						// Only check right side connection point
						const rightPoint = {
							x: element.x + element.width,
							y: element.y + element.height / 2,
						};

						const rightDistance = Math.sqrt(
							Math.pow(canvasPos.x - rightPoint.x, 2) +
								Math.pow(canvasPos.y - rightPoint.y, 2),
						);

						if (
							rightDistance < threshold &&
							(!closestNode || rightDistance < closestNode.distance)
						) {
							closestNode = {
								nodeId: element.id,
								side: "right",
								distance: rightDistance,
							};
						}
					}
				});

				const newNearbyNode = closestNode
					? { nodeId: closestNode.nodeId, side: closestNode.side }
					: null;

				console.log("🎯 Setting nearby node:", newNearbyNode);
				setNearbyNode(newNearbyNode);
			};

			const handleGlobalMouseDown = (e: MouseEvent) => {
				console.log("🖱️ Global mouse down triggered");
				isMouseDown = true;

				// Small delay to let selection happen first
				setTimeout(() => {
					const selectedElements = api.getSelectedElements();
					console.log("🔍 Selected elements after delay:", selectedElements);

					if (selectedElements.length === 1) {
						const elements = api.getCanvasState().elements;
						const element = Array.from(elements.values()).find(
							(el) => el.id === selectedElements[0],
						);
						console.log("🔍 Found selected element:", element);

						if (element?.type === "mindmap") {
							console.log("🖱️ Starting drag for mindmap node:", element.id);
							dragStartPos = { x: e.clientX, y: e.clientY };
							currentDraggedNodeId = element.id;
							setDraggedNode(element.id);
							console.log("✅ Drag setup complete:", {
								dragStartPos,
								currentDraggedNodeId,
							});
						} else {
							console.log("❌ Element is not mindmap type:", element?.type);
						}
					} else {
						console.log(
							"❌ Wrong number of selected elements:",
							selectedElements.length,
						);
					}
				}, 10); // Small delay to let selection complete
			};

			const handleGlobalMouseMove = (e: MouseEvent) => {
				if (!isMouseDown || !dragStartPos || !currentDraggedNodeId) {
					return;
				}

				const deltaX = Math.abs(e.clientX - dragStartPos.x);
				const deltaY = Math.abs(e.clientY - dragStartPos.y);

				console.log("🔄 Mouse move - delta:", {
					deltaX,
					deltaY,
					isDragMode,
					currentDraggedNodeId,
				});

				// Start drag mode if moved more than 5px
				if (!isDragMode && (deltaX > 5 || deltaY > 5)) {
					console.log("🔄 Entering drag mode for:", currentDraggedNodeId);
					isDragMode = true;
					setIsDragging(true);
				}

				// Check for nearby nodes during drag
				if (isDragMode) {
					console.log("✅ In drag mode, checking for nearby nodes");
					checkForNearbyNodes(e);
				}
			};

			const handleGlobalMouseUp = () => {
				console.log("🔥 MOUSE UP:", {
					isDragMode,
					currentDraggedNodeId,
					isMouseDown,
				});

				if (isDragMode && currentDraggedNodeId) {
					const currentNearbyNode = useMindmapStore.getState().nearbyNode;
					console.log("Current nearby node from store:", currentNearbyNode);

					if (currentNearbyNode) {
						console.log(
							`🔗 RECONNECTING ${currentDraggedNodeId} to ${currentNearbyNode.nodeId} on ${currentNearbyNode.side}`,
						);

						// Perform the reconnection with automatic subtree reorganization
						// The reorganization will handle positioning correctly
						reconnectNode(
							currentDraggedNodeId,
							currentNearbyNode.nodeId,
							currentNearbyNode.side,
							api,
						);
					} else {
						console.log("❌ No nearby node to connect to");
					}
				}

				// Reset all state
				isMouseDown = false;
				dragStartPos = null;
				isDragMode = false;
				currentDraggedNodeId = null;
				setIsDragging(false);
				setDraggedNode(null);
				setNearbyNode(null);
			};

			// Attach global event listeners
			document.addEventListener("mousedown", handleGlobalMouseDown, true); // Use capture phase
			document.addEventListener("mousemove", handleGlobalMouseMove);
			document.addEventListener("mouseup", handleGlobalMouseUp);

			console.log("📋 Global event listeners attached");

			return () => {
				console.log("🧹 Cleaning up global event listeners");
				document.removeEventListener("mousedown", handleGlobalMouseDown, true);
				document.removeEventListener("mousemove", handleGlobalMouseMove);
				document.removeEventListener("mouseup", handleGlobalMouseUp);
			};
		}, [api, setIsDragging, setDraggedNode, setNearbyNode, reconnectNode]);

		return null;
	});
