import type { Disposable, Plugin, PluginAPI, Element } from "@jammwork/api";
import { Workflow } from "lucide-react";
import { MindmapRenderer } from "./MindmapRenderer";
import { ConnectionsLayer } from "./ConnectionsLayer";
import { DragAttachmentHandler } from "./DragAttachmentHandler";
import { useMindmapStore } from "./store";

let disposables: Disposable[] = [];

export const MindmapPlugin: Plugin = {
	id: "mindmap",
	name: "Mind map",
	version: "1.0.0",
	description: "Mind map like Whimsical",
	author: "JammWork",

	activate: async (api: PluginAPI) => {
		// Helper function to create connected nodes
		const createConnectedNode = (
			parentElement: Element,
			type: "child" | "sibling",
		) => {
			if (type === "child") {
				// Create child on the right side
				const spacing = 200; // Increased spacing for child nodes
				const childrenOnRight = useMindmapStore
					.getState()
					.getChildrenOnSide(parentElement.id, "right");
				const verticalOffset = childrenOnRight.length * 80;

				const newX = parentElement.x + spacing;
				const newY = parentElement.y + verticalOffset;

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
				useMindmapStore
					.getState()
					.addConnection(parentElement.id, newNodeId, "right", api);

				// Auto-select the new node
				api.clearSelection();
				api.selectElement(newNodeId);
			} else {
				// Create sibling - need to find parent and add as its child
				const hierarchy = useMindmapStore
					.getState()
					.nodeHierarchy.get(parentElement.id);
				if (hierarchy?.parentId) {
					const elements = api.getCanvasState().elements;
					const parentEl = Array.from(elements.values()).find(
						(el) => el.id === hierarchy.parentId,
					);

					if (parentEl) {
						const side = hierarchy.side || "right";

						// Position sibling below current node, not stacked from parent
						const newX = parentElement.x; // Same X as current node
						const newY = parentElement.y + 80; // 80px below current node

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
						useMindmapStore
							.getState()
							.addConnection(hierarchy.parentId, newNodeId, side, api);

						// Auto-select the new node
						api.clearSelection();
						api.selectElement(newNodeId);
					}
				}
			}
		};

		// Global keyboard shortcuts
		const handleKeyDown = (e: KeyboardEvent) => {
			const selectedElements = api.getSelectedElements();
			const elements = api.getCanvasState().elements;
			const mindmapNodes = selectedElements.filter((id) => {
				const element = Array.from(elements.values()).find(
					(el) => el.id === id,
				);
				return element?.type === "mindmap";
			});

			if (mindmapNodes.length === 1 && !e.metaKey && !e.ctrlKey) {
				const nodeId = mindmapNodes[0];
				const element = Array.from(elements.values()).find(
					(el) => el.id === nodeId,
				);

				if (!element) return;

				if (e.key === "Enter") {
					e.preventDefault();
					createConnectedNode(element, "sibling");
				} else if (e.key === "Tab") {
					e.preventDefault();
					createConnectedNode(element, "child");
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		const keyboardDisposable = {
			dispose: () => {
				document.removeEventListener("keydown", handleKeyDown);
			},
		};
		// Register element type
		const elementDisposable = api.registerElementType("mindmap", {
			render: (element) => {
				return <MindmapRenderer element={element} api={api} />;
			},
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		// Register mindmap creation tool
		const toolDisposable = api.registerTool({
			id: "mindmap",
			name: "Mind map",
			icon: <Workflow size={16} />,
			cursor: "crosshair",
			onMouseDown: (event) => {
				const canvasPos = api.screenToCanvas({
					x: event.clientX,
					y: event.clientY,
				});

				// Create element at click position
				const element = {
					type: "mindmap",
					x: canvasPos.x - 50,
					y: canvasPos.y - 50,
					width: 120,
					height: 40,
					properties: {
						text: "New Node",
					},
				};

				api.createElement(element);
			},
		});

		// Register connections layer
		const layerDisposable = api.registerLayerComponent(() => (
			<ConnectionsLayer api={api} />
		));

		// Register drag attachment handler
		const dragDisposable = api.registerLayerComponent(() => (
			<DragAttachmentHandler api={api} />
		));

		// NOTE: No longer need to manually register layer component for rendering mindmap elements.
		// The built-in ElementsLayer automatically renders all registered element types.

		disposables.push(
			elementDisposable,
			toolDisposable,
			layerDisposable,
			dragDisposable,
			keyboardDisposable,
		);
	},

	deactivate: async () => {
		disposables.forEach((disposable) => disposable.dispose());
		disposables = [];
	},
};
