import type { PluginAPI } from "@jammwork/api";
import React, { useEffect } from "react";
import { useMindmapStore } from "./store";

interface DragAttachmentHandlerProps {
	api: PluginAPI;
}

export const DragAttachmentHandler: React.FC<DragAttachmentHandlerProps> =
	React.memo(({ api }) => {
		const {
			setIsDragging,
			setDraggedNode,
			setNearbyNode,
			reconnectNode,
			moveNodeWithBranch,
			severNodeConnection,
		} = useMindmapStore();

		useEffect(() => {
			let isMouseDown = false;
			let dragStartPos: { x: number; y: number } | null = null;
			let isDragMode = false;
			let currentDraggedNodeId: string | null = null;
			let dragMode: "normal" | "sever" | "connect" = "normal";
			let lastMousePos: { x: number; y: number } | null = null;

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
					const el = element as any;
					if (el.type === "mindmap" && el.id !== currentDraggedNodeId) {
						// Only check right side connection point
						const rightPoint = {
							x: el.x + el.width,
							y: el.y + el.height / 2,
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
								nodeId: el.id,
								side: "right" as const,
								distance: rightDistance,
							};
						}
					}
				});

				let newNearbyNode: { nodeId: string; side: "left" | "right" } | null =
					null;
				if (closestNode) {
					newNearbyNode = {
						nodeId: (closestNode as any).nodeId,
						side: (closestNode as any).side,
					};
				}

				console.log("🎯 Setting nearby node:", newNearbyNode);
				setNearbyNode(newNearbyNode);
			};

			const handleGlobalMouseDown = (e: MouseEvent) => {
				console.log("🖱️ Global mouse down triggered");
				isMouseDown = true;

				// Determine drag mode based on modifiers
				if (e.altKey) {
					dragMode = "sever";
				} else {
					dragMode = "normal";
				}

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
							console.log(
								`🖱️ Starting ${dragMode} drag for mindmap node:`,
								element.id,
							);
							dragStartPos = { x: e.clientX, y: e.clientY };
							lastMousePos = { x: e.clientX, y: e.clientY };
							currentDraggedNodeId = element.id;
							setDraggedNode(element.id);
							console.log("✅ Drag setup complete:", {
								dragStartPos,
								currentDraggedNodeId,
								dragMode,
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
				if (
					!isMouseDown ||
					!dragStartPos ||
					!currentDraggedNodeId ||
					!lastMousePos
				) {
					return;
				}

				const deltaX = Math.abs(e.clientX - dragStartPos.x);
				const deltaY = Math.abs(e.clientY - dragStartPos.y);

				console.log("🔄 Mouse move - delta:", {
					deltaX,
					deltaY,
					isDragMode,
					currentDraggedNodeId,
					dragMode,
				});

				// Start drag mode if moved more than 5px
				if (!isDragMode && (deltaX > 5 || deltaY > 5)) {
					console.log(
						`🔄 Entering ${dragMode} drag mode for:`,
						currentDraggedNodeId,
					);
					isDragMode = true;
					setIsDragging(true);

					// If it's sever mode, immediately sever the connection
					if (dragMode === "sever") {
						severNodeConnection(currentDraggedNodeId, api);
					}
				}

				// Handle movement during drag
				if (isDragMode) {
					if (dragMode === "normal" || dragMode === "sever") {
						// Move the node and its branch
						const mouseDeltaX = e.clientX - lastMousePos.x;
						const mouseDeltaY = e.clientY - lastMousePos.y;

						if (Math.abs(mouseDeltaX) > 0 || Math.abs(mouseDeltaY) > 0) {
							const canvasDelta = api.screenToCanvas({
								x: mouseDeltaX,
								y: mouseDeltaY,
							});
							const canvasOrigin = api.screenToCanvas({ x: 0, y: 0 });

							moveNodeWithBranch(
								currentDraggedNodeId,
								canvasDelta.x - canvasOrigin.x,
								canvasDelta.y - canvasOrigin.y,
								api,
							);
						}
					}

					// Always check for nearby nodes for potential reconnection
					checkForNearbyNodes(e);
				}

				// Update last mouse position
				lastMousePos = { x: e.clientX, y: e.clientY };
			};

			const handleGlobalMouseUp = () => {
				console.log("🔥 MOUSE UP:", {
					isDragMode,
					currentDraggedNodeId,
					isMouseDown,
					dragMode,
				});

				if (isDragMode && currentDraggedNodeId) {
					const currentNearbyNode = useMindmapStore.getState().nearbyNode;
					console.log("Current nearby node from store:", currentNearbyNode);

					if (
						currentNearbyNode &&
						(dragMode === "normal" || dragMode === "sever")
					) {
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
						console.log(
							"❌ No nearby node to connect to or not in reconnect mode",
						);
						// Reorganization will be handled by the element:updated event listener
					}
				}

				// Reset all state
				isMouseDown = false;
				dragStartPos = null;
				isDragMode = false;
				currentDraggedNodeId = null;
				dragMode = "normal";
				lastMousePos = null;
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
