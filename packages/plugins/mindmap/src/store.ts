import { create } from "zustand";
import type { Element } from "@jammwork/api";
import type * as Y from "yjs";

interface Connection {
	id: string;
	parentId: string;
	childId: string;
	side: "left" | "right"; // Which side of parent the child is on
}

interface NodeHierarchy {
	nodeId: string;
	parentId: string | null;
	children: string[];
	side: "left" | "right" | null; // Which side of parent this node is on
}

interface MindmapState {
	isActive: boolean;
	connections: Connection[];
	nodeHierarchy: Map<string, NodeHierarchy>;
	draggedNodeId: string | null;
	nearbyNode: { nodeId: string; side: "left" | "right" } | null;
	isDragging: boolean;
	yjsDoc: Y.Doc | null;
	yjsListeners: (() => void)[];

	setActive: (active: boolean) => void;
	setDraggedNode: (nodeId: string | null) => void;
	setNearbyNode: (
		nearby: { nodeId: string; side: "left" | "right" } | null,
	) => void;
	setIsDragging: (dragging: boolean) => void;
	setYjsDoc: (doc: Y.Doc | null) => void;
	initializeFromYjs: () => void;
	setupYjsListeners: () => void;
	cleanupYjsListeners: () => void;
	addConnection: (
		parentId: string,
		childId: string,
		side: "left" | "right",
		api?: any,
	) => void;
	removeConnection: (connectionId: string) => void;
	updateNodeHierarchy: (
		nodeId: string,
		parentId: string | null,
		side: "left" | "right" | null,
	) => void;
	getConnectionsForNode: (nodeId: string) => Connection[];
	getChildrenOnSide: (nodeId: string, side: "left" | "right") => string[];
	removeNodeFromHierarchy: (nodeId: string) => void;
	createNodeOnSide: (parentId: string, side: "left" | "right") => string;
	reconnectNode: (
		nodeId: string,
		newParentId: string,
		side: "left" | "right",
		api?: any,
	) => void;
	calculateNodePosition: (
		parentId: string,
		api?: any,
	) => { horizontalOffset: number; verticalOffset: number };
	reorganizeSubtree: (nodeId: string, api: any) => void;
	getAllDescendants: (nodeId: string) => string[];
	reorganizeEntireMindmap: (api: any) => void;
	getRootNodes: () => string[];
	cleanupDeletedNodes: (api: any) => void;
	redistributeChildrenWithSpacing: (parentId: string, api: any) => void;
	moveNodeWithBranch: (
		nodeId: string,
		deltaX: number,
		deltaY: number,
		api: any,
	) => void;
	severNodeConnection: (nodeId: string, api: any) => void;
	deleteNodeAndDescendants: (nodeId: string, api: any) => void;
}

export const useMindmapStore = create<MindmapState>((set, get) => ({
	isActive: false,
	connections: [],
	nodeHierarchy: new Map(),
	draggedNodeId: null,
	nearbyNode: null,
	isDragging: false,
	yjsDoc: null,
	yjsListeners: [],

	setActive: (active) => set({ isActive: active }),
	setDraggedNode: (nodeId) => set({ draggedNodeId: nodeId }),
	setNearbyNode: (nearby) => set({ nearbyNode: nearby }),
	setIsDragging: (dragging) => set({ isDragging: dragging }),

	setYjsDoc: (doc) => {
		// Clean up existing listeners first
		get().cleanupYjsListeners();

		set({ yjsDoc: doc });
		if (doc) {
			get().initializeFromYjs();
			get().setupYjsListeners();
		}
	},

	setupYjsListeners: () => {
		const state = get();
		if (!state.yjsDoc) return;

		const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
		const hierarchyMap = state.yjsDoc.getMap("mindmap-hierarchy");

		// Listen for connection changes
		const connectionsListener = (event: any) => {
			console.log("🔄 Connections changed in Yjs:", event);

			// Reload all connections from Yjs
			const connections: Connection[] = [];
			connectionsMap.forEach((connection: any, id: string) => {
				connections.push({
					id,
					parentId: connection.parentId,
					childId: connection.childId,
					side: connection.side,
				});
			});

			console.log(`📡 Real-time update: ${connections.length} connections`);
			set({ connections });
		};

		// Listen for hierarchy changes
		const hierarchyListener = (event: any) => {
			console.log("🔄 Hierarchy changed in Yjs:", event);

			// Reload all hierarchy from Yjs
			const nodeHierarchy = new Map<string, NodeHierarchy>();
			hierarchyMap.forEach((hierarchy: any, nodeId: string) => {
				nodeHierarchy.set(nodeId, {
					nodeId,
					parentId: hierarchy.parentId,
					children: hierarchy.children || [],
					side: hierarchy.side,
				});
			});

			console.log(
				`📡 Real-time update: ${nodeHierarchy.size} hierarchy entries`,
			);
			set({ nodeHierarchy });
		};

		connectionsMap.observe(connectionsListener);
		hierarchyMap.observe(hierarchyListener);

		// Store cleanup functions
		const cleanup = [
			() => connectionsMap.unobserve(connectionsListener),
			() => hierarchyMap.unobserve(hierarchyListener),
		];

		set({ yjsListeners: cleanup });
		console.log("👂 Yjs change listeners set up for real-time sync");
	},

	cleanupYjsListeners: () => {
		const state = get();
		state.yjsListeners.forEach((cleanup) => cleanup());
		set({ yjsListeners: [] });
		console.log("🧹 Cleaned up Yjs listeners");
	},

	initializeFromYjs: () => {
		const state = get();
		console.log("🔄 initializeFromYjs called, yjsDoc:", state.yjsDoc);

		if (!state.yjsDoc) {
			console.warn("⚠️ No Yjs document available for initialization");
			return;
		}

		const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
		const hierarchyMap = state.yjsDoc.getMap("mindmap-hierarchy");

		console.log("📊 Yjs maps:", {
			connectionsMapSize: connectionsMap.size,
			hierarchyMapSize: hierarchyMap.size,
		});

		// Load connections from Yjs
		const connections: Connection[] = [];
		connectionsMap.forEach((connection: any, id: string) => {
			console.log(`📝 Loading connection ${id}:`, connection);
			connections.push({
				id,
				parentId: connection.parentId,
				childId: connection.childId,
				side: connection.side,
			});
		});

		// Load hierarchy from Yjs
		const nodeHierarchy = new Map<string, NodeHierarchy>();
		hierarchyMap.forEach((hierarchy: any, nodeId: string) => {
			console.log(`🌳 Loading hierarchy for ${nodeId}:`, hierarchy);
			nodeHierarchy.set(nodeId, {
				nodeId,
				parentId: hierarchy.parentId,
				children: hierarchy.children || [],
				side: hierarchy.side,
			});
		});

		console.log(
			`✅ Initialized mindmap from Yjs: ${connections.length} connections, ${nodeHierarchy.size} hierarchy entries`,
		);

		// Log the actual data being set
		console.log("📋 Connections being set:", connections);
		console.log("🗂️ Hierarchy being set:", Array.from(nodeHierarchy.entries()));

		set({
			connections,
			nodeHierarchy,
		});
	},

	addConnection: (parentId, childId, side, api?: any) => {
		// Clean up any stale data first
		if (api) {
			get().cleanupDeletedNodes(api);
		}

		const connectionId = `${parentId}-${childId}`;
		const existingConnection = get().connections.find(
			(conn) => conn.parentId === parentId && conn.childId === childId,
		);

		if (!existingConnection) {
			const newConnection = { id: connectionId, parentId, childId, side };

			set((state) => ({
				connections: [...state.connections, newConnection],
			}));

			// Persist to Yjs
			const state = get();
			if (state.yjsDoc) {
				const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
				console.log(`💾 Saving connection to Yjs: ${connectionId}`, {
					parentId,
					childId,
					side,
				});
				connectionsMap.set(connectionId, {
					parentId,
					childId,
					side,
				});
				console.log(
					`✅ Connection saved. Total connections in Yjs: ${connectionsMap.size}`,
				);
			} else {
				console.warn("⚠️ No Yjs document available for saving connection");
			}
		}

		// Update hierarchy
		get().updateNodeHierarchy(childId, parentId, side);

		// Trigger full reorganization after adding connection
		if (api) {
			console.log(
				`🔗 Added connection ${parentId} -> ${childId}, triggering reorganization`,
			);
			get().reorganizeEntireMindmap(api);
		}
	},

	removeConnection: (connectionId) => {
		const connection = get().connections.find(
			(conn) => conn.id === connectionId,
		);
		if (connection) {
			// Remove from hierarchy
			get().updateNodeHierarchy(connection.childId, null, null);
		}

		set((state) => ({
			connections: state.connections.filter((conn) => conn.id !== connectionId),
		}));

		// Remove from Yjs
		const state = get();
		if (state.yjsDoc) {
			const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
			connectionsMap.delete(connectionId);
		}
	},

	updateNodeHierarchy: (nodeId, parentId, side) => {
		const hierarchy = get().nodeHierarchy;
		const currentNode = hierarchy.get(nodeId);

		// Remove from old parent's children list
		if (currentNode?.parentId) {
			const oldParent = hierarchy.get(currentNode.parentId);
			if (oldParent) {
				oldParent.children = oldParent.children.filter((id) => id !== nodeId);
				hierarchy.set(currentNode.parentId, oldParent);
			}
		}

		// Update node's hierarchy info
		const updatedNode: NodeHierarchy = {
			nodeId,
			parentId,
			side,
			children: currentNode?.children || [],
		};
		hierarchy.set(nodeId, updatedNode);

		// Add to new parent's children list
		if (parentId) {
			const parent = hierarchy.get(parentId) || {
				nodeId: parentId,
				parentId: null,
				children: [],
				side: null,
			};
			if (!parent.children.includes(nodeId)) {
				parent.children.push(nodeId);
			}
			hierarchy.set(parentId, parent);
		}

		set({ nodeHierarchy: new Map(hierarchy) });

		// Persist hierarchy to Yjs
		const state = get();
		if (state.yjsDoc) {
			const hierarchyMap = state.yjsDoc.getMap("mindmap-hierarchy");

			// Update the modified node
			hierarchyMap.set(nodeId, {
				parentId: updatedNode.parentId,
				children: updatedNode.children,
				side: updatedNode.side,
			});

			// Update the old parent if it exists
			if (currentNode?.parentId && hierarchy.has(currentNode.parentId)) {
				const oldParent = hierarchy.get(currentNode.parentId)!;
				hierarchyMap.set(currentNode.parentId, {
					parentId: oldParent.parentId,
					children: oldParent.children,
					side: oldParent.side,
				});
			}

			// Update the new parent if it exists
			if (parentId && hierarchy.has(parentId)) {
				const newParent = hierarchy.get(parentId)!;
				hierarchyMap.set(parentId, {
					parentId: newParent.parentId,
					children: newParent.children,
					side: newParent.side,
				});
			}
		}
	},

	getConnectionsForNode: (nodeId) => {
		return get().connections.filter(
			(conn) => conn.parentId === nodeId || conn.childId === nodeId,
		);
	},

	getChildrenOnSide: (nodeId, side) => {
		const connections = get().connections.filter(
			(conn) => conn.parentId === nodeId && conn.side === side,
		);
		return connections.map((conn) => conn.childId);
	},

	removeNodeFromHierarchy: (nodeId) => {
		const hierarchy = get().nodeHierarchy;
		const node = hierarchy.get(nodeId);

		if (node) {
			// Remove from parent's children
			if (node.parentId) {
				const parent = hierarchy.get(node.parentId);
				if (parent) {
					parent.children = parent.children.filter((id) => id !== nodeId);
					hierarchy.set(node.parentId, parent);
				}
			}

			// Remove connections
			const connections = get().connections.filter(
				(conn) => conn.parentId !== nodeId && conn.childId !== nodeId,
			);

			hierarchy.delete(nodeId);
			set({
				nodeHierarchy: new Map(hierarchy),
				connections,
			});
		}
	},

	createNodeOnSide: (parentId, side) => {
		// This will be implemented when we integrate with the API
		// For now, return a placeholder ID
		return `temp-${Date.now()}`;
	},

	reconnectNode: (nodeId, newParentId, side, api?: any) => {
		const state = get();

		// Remove existing connections for this node
		const existingConnections = state.connections.filter(
			(conn) => conn.childId === nodeId,
		);

		// Remove old connections
		existingConnections.forEach((conn) => {
			state.removeConnection(conn.id);
		});

		// Add new connection
		state.addConnection(newParentId, nodeId, side);

		// After reconnection, reorganize the entire mindmap for optimal layout
		if (api) {
			console.log(
				`🔄 Reconnected ${nodeId} to ${newParentId} - triggering full mindmap reorganization`,
			);

			// Reorganize the entire mindmap to ensure perfect positioning
			state.reorganizeEntireMindmap(api);
		}
	},

	// Helper function to reorganize an entire subtree
	reorganizeSubtree: (nodeId: string, api: any) => {
		const state = get();
		console.log(`🔄 Reorganizing subtree for node: ${nodeId}`);

		// Recursively reorganize all children of a node
		const reorganizeChildren = (parentNodeId: string) => {
			const elements = api.getCanvasState().elements;
			const parentElement = Array.from(elements.values()).find(
				(el) => (el as Element).id === parentNodeId,
			) as Element | undefined;

			if (!parentElement) return;

			// Use the new collision-aware redistribution function
			state.redistributeChildrenWithSpacing(parentNodeId, api);

			// Recursively reorganize each child's subtree
			const children = state.getChildrenOnSide(parentNodeId, "right");
			children.forEach((childId) => {
				reorganizeChildren(childId);
			});
		};

		// Start reorganization from the specified node
		reorganizeChildren(nodeId);
	},

	// Helper function to get all descendants of a node
	getAllDescendants: (nodeId: string) => {
		const state = get();
		const descendants: string[] = [];

		const collectDescendants = (currentNodeId: string) => {
			const children = state.getChildrenOnSide(currentNodeId, "right");
			children.forEach((childId) => {
				descendants.push(childId);
				collectDescendants(childId); // Recursive call for grandchildren
			});
		};

		collectDescendants(nodeId);
		return descendants;
	},

	// Helper function to find all root nodes (nodes with no parents)
	getRootNodes: () => {
		const state = get();
		const allNodeIds = new Set<string>();
		const childNodeIds = new Set<string>();

		// Collect all node IDs from connections
		state.connections.forEach((conn) => {
			allNodeIds.add(conn.parentId);
			allNodeIds.add(conn.childId);
			childNodeIds.add(conn.childId);
		});

		// Root nodes are those that appear as parents but never as children
		const rootNodes = Array.from(allNodeIds).filter(
			(nodeId) => !childNodeIds.has(nodeId),
		);

		console.log(`🌳 Found ${rootNodes.length} root nodes:`, rootNodes);
		return rootNodes;
	},

	// Comprehensive function to reorganize the entire mindmap
	reorganizeEntireMindmap: (api: any) => {
		const state = get();
		console.log("🌟 FULL MINDMAP REORGANIZATION STARTED");

		// Clean up deleted nodes first
		state.cleanupDeletedNodes(api);

		// Get all root nodes (nodes with no parents)
		const rootNodes = state.getRootNodes();

		// If no connections exist, find all mindmap elements and treat them as roots
		if (rootNodes.length === 0) {
			const elements = api.getCanvasState().elements;
			const mindmapElements = Array.from(elements.values()).filter(
				(el) => (el as Element).type === "mindmap",
			) as Element[];

			console.log(
				`📍 No connections found, treating all ${mindmapElements.length} mindmap elements as independent`,
			);
			return; // Nothing to reorganize if no connections
		}

		// Reorganize each root tree
		rootNodes.forEach((rootNodeId, index) => {
			console.log(
				`🌳 Reorganizing tree ${index + 1}/${rootNodes.length} starting from root: ${rootNodeId}`,
			);
			state.reorganizeSubtree(rootNodeId, api);
		});

		console.log("✅ FULL MINDMAP REORGANIZATION COMPLETED");
	},

	// New function to calculate automatic position for a node (right side only)
	calculateNodePosition: (parentId: string, api?: any) => {
		const state = get();
		const spacing = 200; // Horizontal spacing for children
		const verticalSpacing = 80; // Vertical spacing between siblings

		// Only support right side connections
		const side = "right";

		// Clean up deleted nodes first if API is available
		if (api) {
			state.cleanupDeletedNodes(api);
		}

		// If API is provided, check actual canvas elements first
		if (api) {
			const elements = api.getCanvasState().elements;
			const parentElement = Array.from(elements.values()).find(
				(el) => (el as Element).id === parentId,
			) as Element | undefined;

			if (parentElement) {
				// Find all actual children that exist in the canvas and are connected to this parent
				const actualChildren: string[] = [];
				const occupiedPositions = new Set<number>();

				// Check all mindmap elements to find actual children
				Array.from(elements.values()).forEach((element) => {
					const el = element as Element;
					if (el.type === "mindmap" && el.id !== parentId) {
						// Check if this element is connected as a child
						const connection = state.connections.find(
							(conn) =>
								conn.parentId === parentId &&
								conn.childId === el.id &&
								conn.side === side,
						);
						if (connection) {
							actualChildren.push(el.id);
							const relativeY = el.y - parentElement.y;
							occupiedPositions.add(relativeY);
							console.log(
								`📊 Actual child ${el.id} occupies relative Y: ${relativeY}`,
							);
						}
					}
				});

				console.log(
					`🔍 Calculating position for parent ${parentId}, actual children in canvas: ${actualChildren.length}`,
				);

				// If no actual children exist, position straight across (first child case)
				if (actualChildren.length === 0) {
					const targetX = parentElement.x + spacing;
					const targetY = parentElement.y; // Straight across

					// Check for collisions with other mindmap elements
					const allMindmapElements = Array.from(elements.values()).filter(
						(el) =>
							(el as Element).type === "mindmap" &&
							(el as Element).id !== parentId,
					) as Element[];

					let collisionFreeY = targetY;
					let attempts = 0;
					const maxAttempts = 20;
					const nodeHeight = 40;
					const buffer = 20;

					while (attempts < maxAttempts) {
						let hasCollision = false;

						for (const element of allMindmapElements) {
							const elementBottom = element.y + element.height + buffer;
							const elementTop = element.y - buffer;
							const childBottom = collisionFreeY + nodeHeight + buffer;
							const childTop = collisionFreeY - buffer;

							// Check if X ranges overlap
							const xOverlap =
								targetX < element.x + element.width + buffer &&
								targetX + 120 + buffer > element.x; // 120 is assumed child width

							// Check if Y ranges overlap
							const yOverlap =
								childTop < elementBottom && childBottom > elementTop;

							if (xOverlap && yOverlap) {
								console.log(
									`⚠️ Collision detected at Y:${collisionFreeY} with element ${element.id}`,
								);
								hasCollision = true;
								collisionFreeY = element.y + element.height + buffer;
								break;
							}
						}

						if (!hasCollision) break;
						attempts++;
					}

					const finalOffset = collisionFreeY - parentElement.y;
					console.log(
						`📍 First child - positioning ${finalOffset === 0 ? "straight across" : "with collision avoidance"} at verticalOffset: ${finalOffset}`,
					);
					return {
						horizontalOffset: spacing,
						verticalOffset: finalOffset,
					};
				}

				// If exactly one child exists, try to keep it straight across
				if (actualChildren.length === 1) {
					console.log(
						`📍 Single child detected - attempting to position straight across from parent`,
					);
					return {
						horizontalOffset: spacing,
						verticalOffset: 0, // Straight across
					};
				}

				// Try positions: 0 (straight), then 80, 160, 240, etc. (downward)
				let testOffset = 0;
				while (occupiedPositions.has(testOffset)) {
					console.log(`🚫 Position ${testOffset} is occupied, trying next...`);
					testOffset += verticalSpacing;
				}

				console.log(
					`✅ Found available position at verticalOffset: ${testOffset}`,
				);
				return {
					horizontalOffset: spacing,
					verticalOffset: testOffset,
				};
			}
		}

		// Fallback: use hierarchy data if no API provided
		const existingChildren = state.getChildrenOnSide(parentId, side);
		console.log(
			`⚠️ Fallback: using hierarchy data, children count: ${existingChildren.length}`,
		);

		if (existingChildren.length === 0) {
			return {
				horizontalOffset: spacing,
				verticalOffset: 0,
			};
		}

		const fallbackOffset = existingChildren.length * verticalSpacing;
		return {
			horizontalOffset: spacing,
			verticalOffset: fallbackOffset,
		};
	},

	// Function to clean up deleted nodes from hierarchy and connections
	cleanupDeletedNodes: (api: any) => {
		const state = get();
		const elements = api.getCanvasState().elements;
		const existingElementIds = new Set(
			Array.from(elements.values()).map((el) => (el as Element).id),
		);

		// Clean up connections for deleted nodes
		const validConnections = state.connections.filter(
			(conn) =>
				existingElementIds.has(conn.parentId) &&
				existingElementIds.has(conn.childId),
		);

		// Clean up hierarchy for deleted nodes
		const validHierarchy = new Map();
		state.nodeHierarchy.forEach((hierarchy, nodeId) => {
			if (existingElementIds.has(nodeId)) {
				// Clean up the children list to only include existing nodes
				const validChildren = hierarchy.children.filter((childId) =>
					existingElementIds.has(childId),
				);

				// Clean up parent reference if parent doesn't exist
				const validParentId =
					hierarchy.parentId && existingElementIds.has(hierarchy.parentId)
						? hierarchy.parentId
						: null;

				validHierarchy.set(nodeId, {
					...hierarchy,
					parentId: validParentId,
					children: validChildren,
					side: validParentId ? hierarchy.side : null,
				});
			}
		});

		console.log(
			`🧹 Cleaned up deleted nodes: ${state.connections.length - validConnections.length} connections removed, ${state.nodeHierarchy.size - validHierarchy.size} hierarchy entries removed`,
		);

		set({
			connections: validConnections,
			nodeHierarchy: validHierarchy,
		});
	},

	// Function to redistribute children with proper spacing, avoiding collisions
	redistributeChildrenWithSpacing: (parentId: string, api: any) => {
		const state = get();
		const elements = api.getCanvasState().elements;
		const parentElement = Array.from(elements.values()).find(
			(el) => (el as Element).id === parentId,
		) as Element | undefined;

		if (!parentElement) return;

		const children = state.getChildrenOnSide(parentId, "right");
		if (children.length === 0) return;

		console.log(
			`🔄 Redistributing ${children.length} children for parent: ${parentId}`,
		);

		const spacing = 200; // Horizontal spacing
		const verticalSpacing = 80; // Vertical spacing between siblings
		const nodeHeight = 40; // Assuming standard node height
		const buffer = 20; // Extra buffer to prevent tight spacing

		// Get all existing mindmap elements to check for collisions
		const allMindmapElements = Array.from(elements.values()).filter(
			(el) =>
				(el as Element).type === "mindmap" &&
				(el as Element).id !== parentId &&
				!children.includes((el as Element).id),
		) as Element[];

		// Position each child and check for collisions
		const finalPositions: { [childId: string]: { x: number; y: number } } = {};
		const targetX = parentElement.x + spacing;

		// Special case: If there's only one child, try to position it straight across from parent
		if (children.length === 1) {
			const childId = children[0];
			let targetY = parentElement.y; // Start with straight across position
			let collisionFound = false;

			// Check for collisions with existing elements at the straight position
			for (const element of allMindmapElements) {
				const elementBottom = element.y + element.height + buffer;
				const elementTop = element.y - buffer;
				const childBottom = targetY + nodeHeight + buffer;
				const childTop = targetY - buffer;

				// Check if X ranges overlap (child is in same horizontal area)
				const xOverlap =
					targetX < element.x + element.width + buffer &&
					targetX + 120 + buffer > element.x; // 120 is assumed child width

				// Check if Y ranges overlap
				const yOverlap = childTop < elementBottom && childBottom > elementTop;

				if (xOverlap && yOverlap) {
					console.log(
						`⚠️ Collision detected for single child ${childId} at straight position Y:${targetY} with element ${element.id}`,
					);
					collisionFound = true;
					// Move child below the colliding element
					targetY = Math.max(targetY, element.y + element.height + buffer);
				}
			}

			finalPositions[childId] = { x: targetX, y: targetY };
			console.log(
				`📍 Single child ${childId} positioned at: (${targetX}, ${targetY}) ${collisionFound ? "with collision avoidance" : "straight across"}`,
			);
		} else {
			// Multiple children: Calculate the total height needed for all children
			const totalChildrenHeight = (children.length - 1) * verticalSpacing;

			// Try to center the children group around the parent's Y position
			const startY = parentElement.y - totalChildrenHeight / 2;

			children.forEach((childId, index) => {
				let targetY = startY + index * verticalSpacing;

				// Check for collisions with existing elements
				let collisionFound = true;
				let attempts = 0;
				const maxAttempts = 20;

				while (collisionFound && attempts < maxAttempts) {
					collisionFound = false;
					attempts++;

					// Check collision with other mindmap elements
					for (const element of allMindmapElements) {
						const elementBottom = element.y + element.height + buffer;
						const elementTop = element.y - buffer;
						const childBottom = targetY + nodeHeight + buffer;
						const childTop = targetY - buffer;

						// Check if X ranges overlap (child is in same horizontal area)
						const xOverlap =
							targetX < element.x + element.width + buffer &&
							targetX + 120 + buffer > element.x; // 120 is assumed child width

						// Check if Y ranges overlap
						const yOverlap =
							childTop < elementBottom && childBottom > elementTop;

						if (xOverlap && yOverlap) {
							console.log(
								`⚠️ Collision detected for child ${childId} at Y:${targetY} with element ${element.id} at Y:${element.y}`,
							);
							collisionFound = true;

							// Move child below the colliding element
							targetY = element.y + element.height + buffer;
							break;
						}
					}

					// Check collision with previously positioned children
					for (const [otherChildId, pos] of Object.entries(finalPositions)) {
						if (otherChildId !== childId) {
							const otherBottom = pos.y + nodeHeight + buffer;
							const otherTop = pos.y - buffer;
							const childBottom = targetY + nodeHeight + buffer;
							const childTop = targetY - buffer;

							if (childTop < otherBottom && childBottom > otherTop) {
								console.log(
									`⚠️ Collision detected for child ${childId} with sibling ${otherChildId}`,
								);
								collisionFound = true;
								targetY = pos.y + nodeHeight + buffer;
								break;
							}
						}
					}
				}

				finalPositions[childId] = { x: targetX, y: targetY };
				console.log(
					`📍 Final position for child ${childId}: (${targetX}, ${targetY}) after ${attempts} attempts`,
				);
			});
		}

		// Apply the final positions
		Object.entries(finalPositions).forEach(([childId, position]) => {
			api.updateElement(childId, {
				x: position.x,
				y: position.y,
			});
		});

		console.log(
			`✅ Redistributed ${children.length} children with collision avoidance`,
		);
	},

	moveNodeWithBranch: (
		nodeId: string,
		deltaX: number,
		deltaY: number,
		api: any,
	) => {
		const state = get();
		const elements = api.getCanvasState().elements;

		// Get all descendants of this node
		const descendants = state.getAllDescendants(nodeId);
		const allNodesToMove = [nodeId, ...descendants];

		console.log(
			`🚚 Moving node ${nodeId} with ${descendants.length} descendants by (${deltaX}, ${deltaY})`,
		);

		// Move all nodes in the branch
		allNodesToMove.forEach((id) => {
			const element = Array.from(elements.values()).find(
				(el) => (el as Element).id === id,
			) as Element | undefined;
			if (element) {
				api.updateElement(id, {
					x: element.x + deltaX,
					y: element.y + deltaY,
				});
			}
		});
	},

	severNodeConnection: (nodeId: string, api: any) => {
		const state = get();
		const hierarchy = state.nodeHierarchy.get(nodeId);

		if (hierarchy?.parentId) {
			console.log(`✂️ Severing connection: ${hierarchy.parentId} -> ${nodeId}`);

			const connectionId = `${hierarchy.parentId}-${nodeId}`;

			// Remove the connection
			const connections = state.connections.filter(
				(conn) =>
					!(conn.parentId === hierarchy.parentId && conn.childId === nodeId),
			);

			// Remove from Yjs
			if (state.yjsDoc) {
				const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
				connectionsMap.delete(connectionId);
			}

			// Update hierarchy to make this node parentless
			state.updateNodeHierarchy(nodeId, null, null);

			set({ connections });

			// Reorganize the former parent's subtree
			if (hierarchy.parentId) {
				state.reorganizeSubtree(hierarchy.parentId, api);
			}

			console.log(`✅ Node ${nodeId} is now floating`);
		}
	},

	deleteNodeAndDescendants: (nodeId: string, api: any) => {
		const state = get();
		console.log(`🗑️ Starting cascading deletion for node: ${nodeId}`);

		// Get all descendants before deletion
		const descendants = state.getAllDescendants(nodeId);
		const allNodesToDelete = [nodeId, ...descendants];

		console.log(
			`🗑️ Deleting ${allNodesToDelete.length} nodes: ${allNodesToDelete.join(", ")}`,
		);

		// Remove all connections involving these nodes
		const newConnections = state.connections.filter(
			(conn) =>
				!allNodesToDelete.includes(conn.parentId) &&
				!allNodesToDelete.includes(conn.childId),
		);

		// Get connections to delete from Yjs
		const connectionsToDelete = state.connections.filter(
			(conn) =>
				allNodesToDelete.includes(conn.parentId) ||
				allNodesToDelete.includes(conn.childId),
		);

		// Remove all hierarchy entries for these nodes
		const newHierarchy = new Map(state.nodeHierarchy);
		allNodesToDelete.forEach((id) => {
			newHierarchy.delete(id);
		});

		// Clean up parent references for any remaining nodes
		newHierarchy.forEach((hierarchy, nodeId) => {
			if (hierarchy.parentId && allNodesToDelete.includes(hierarchy.parentId)) {
				hierarchy.parentId = null;
				hierarchy.side = null;
			}
			hierarchy.children = hierarchy.children.filter(
				(childId) => !allNodesToDelete.includes(childId),
			);
		});

		// Update the store
		set({
			connections: newConnections,
			nodeHierarchy: newHierarchy,
		});

		// Remove from Yjs
		if (state.yjsDoc) {
			const connectionsMap = state.yjsDoc.getMap("mindmap-connections");
			const hierarchyMap = state.yjsDoc.getMap("mindmap-hierarchy");

			// Remove connections from Yjs
			connectionsToDelete.forEach((conn) => {
				connectionsMap.delete(conn.id);
			});

			// Remove hierarchy entries from Yjs
			allNodesToDelete.forEach((id) => {
				hierarchyMap.delete(id);
			});

			// Update remaining hierarchy entries in Yjs
			newHierarchy.forEach((hierarchy, nodeId) => {
				hierarchyMap.set(nodeId, {
					parentId: hierarchy.parentId,
					children: hierarchy.children,
					side: hierarchy.side,
				});
			});
		}

		// Delete the actual elements from the canvas
		allNodesToDelete.forEach((id) => {
			try {
				api.deleteElement(id);
				console.log(`✅ Deleted element: ${id}`);
			} catch (error) {
				console.warn(`⚠️ Failed to delete element ${id}:`, error);
			}
		});

		console.log(
			`✅ Cascading deletion completed. Removed ${allNodesToDelete.length} nodes.`,
		);
	},
}));
