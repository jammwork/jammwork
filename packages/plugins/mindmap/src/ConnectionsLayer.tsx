import type { Element, PluginAPI } from "@jammwork/api";
import React, { useEffect, useState } from "react";
import { useMindmapStore } from "./store";

interface ConnectionsLayerProps {
	api: PluginAPI;
}

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = React.memo(
	({ api }) => {
		const connections = useMindmapStore((state) => state.connections);
		const [, setTriggerUpdate] = useState(0);

		// Force re-render when elements change position
		useEffect(() => {
			let animationId: number;

			const updateConnections = () => {
				setTriggerUpdate((prev) => prev + 1);
				animationId = requestAnimationFrame(updateConnections);
			};

			// Start the animation loop - but only update every few frames for performance
			let frameCount = 0;
			const throttledUpdate = () => {
				frameCount++;
				if (frameCount % 3 === 0) {
					// Update every 3rd frame (20fps instead of 60fps)
					setTriggerUpdate((prev) => prev + 1);
				}
				animationId = requestAnimationFrame(throttledUpdate);
			};

			animationId = requestAnimationFrame(throttledUpdate);

			return () => {
				cancelAnimationFrame(animationId);
			};
		}, []);

		const getAllElements = () => {
			return api.getCanvasState().elements;
		};

		const getConnectionPoint = (element: Element, side: "left" | "right") => {
			switch (side) {
				case "left":
					return { x: element.x, y: element.y + element.height / 2 };
				case "right":
					return {
						x: element.x + element.width,
						y: element.y + element.height / 2,
					};
			}
		};

		const renderConnection = (connection: (typeof connections)[0]) => {
			const elements = getAllElements();
			const parentElement = Array.from(elements.values()).find(
				(el) => el.id === connection.parentId,
			);
			const childElement = Array.from(elements.values()).find(
				(el) => el.id === connection.childId,
			);

			if (!parentElement || !childElement) {
				return null;
			}

			const parentPoint = getConnectionPoint(parentElement, connection.side);
			const childPoint = getConnectionPoint(
				childElement,
				connection.side === "left" ? "right" : "left",
			);

			return (
				<g key={connection.id}>
					<line
						x1={parentPoint.x}
						y1={parentPoint.y}
						x2={childPoint.x}
						y2={childPoint.y}
						stroke="#2563eb"
						strokeWidth="2"
						markerEnd="url(#arrowhead)"
					/>
				</g>
			);
		};

		return (
			<g>
				{/* Define arrow marker */}
				<defs>
					<marker
						id="arrowhead"
						markerWidth="10"
						markerHeight="7"
						refX="9"
						refY="3.5"
						orient="auto"
					>
						<polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
					</marker>
				</defs>

				{/* Render all connections */}
				{connections.map(renderConnection)}
			</g>
		);
	},
);
