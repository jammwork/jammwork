import type { Element, PluginAPI } from "@jammwork/api";
import { Pause, Pin, PinOff, Play, RotateCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { TimerElementProperties } from "../types";

interface TimerRendererProps {
	element: Element;
	onUpdate?: (updates: Partial<TimerElementProperties>) => void;
	api?: PluginAPI;
}

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const TimerRenderer: React.FC<TimerRendererProps> = React.memo(
	({ element, onUpdate, api }) => {
		const properties = element.properties as unknown as TimerElementProperties;

		// Use a local display time that syncs with properties but updates smoothly
		const [displayTime, setDisplayTime] = useState(properties.remainingTime);

		// Pin state
		const [isPinned, setIsPinned] = useState(false);

		// Check pin status and sync with API
		useEffect(() => {
			if (api) {
				setIsPinned(api.isPinned(element.id));
			}
		}, [api, element.id]);

		// Sync display time when properties change (from external updates)
		useEffect(() => {
			setDisplayTime(properties.remainingTime);
		}, [properties.remainingTime]);

		// Local countdown for smooth display
		useEffect(() => {
			if (!properties.isRunning || properties.isPaused) {
				return;
			}

			const interval = setInterval(() => {
				if (properties.endTime) {
					// Calculate actual remaining time based on endTime for accuracy
					const now = Date.now();
					const actualRemaining = Math.max(
						0,
						Math.ceil((properties.endTime - now) / 1000),
					);
					setDisplayTime(actualRemaining);

					// Update the synchronized state periodically to keep it in sync
					if (actualRemaining !== properties.remainingTime) {
						onUpdate?.({
							remainingTime: actualRemaining,
							...(actualRemaining === 0 && { isRunning: false }),
						});
					}
				} else {
					// Fallback to simple countdown if no endTime
					setDisplayTime((prev) => {
						const newTime = Math.max(0, prev - 1);
						if (newTime === 0 && onUpdate) {
							onUpdate({
								isRunning: false,
								remainingTime: 0,
							});
						}
						return newTime;
					});
				}
			}, 1000);

			return () => clearInterval(interval);
		}, [
			properties.isRunning,
			properties.isPaused,
			properties.endTime,
			properties.remainingTime,
			onUpdate,
		]);

		const remainingTime = displayTime;

		const handlePin = (event: React.MouseEvent) => {
			if (!api) return;

			if (isPinned) {
				api.unpinElement(element.id);
				setIsPinned(false);
			} else {
				// Get the SVG element to find its position in the viewport
				const svgElement = (event.target as HTMLElement).closest("svg");
				if (!svgElement) {
					console.error("Could not find SVG element");
					return;
				}

				const svgRect = svgElement.getBoundingClientRect();

				// Use API's built-in conversion to get screen coordinates relative to SVG
				const screenPosRelativeToSVG = api.canvasToScreen({
					x: element.x,
					y: element.y,
				});

				// Add the SVG's position in the viewport to get absolute screen coordinates
				const absoluteScreenPos = {
					x: svgRect.left + screenPosRelativeToSVG.x,
					y: svgRect.top + screenPosRelativeToSVG.y,
				};

				api.pinElement(element.id, absoluteScreenPos);
				setIsPinned(true);
			}
		};

		const handlePlayPause = () => {
			if (!onUpdate) return;

			if (!properties.isRunning) {
				onUpdate({
					isRunning: true,
					isPaused: false,
					startTime: Date.now(),
					endTime: Date.now() + remainingTime * 1000,
				});
			} else if (properties.isPaused) {
				const newEndTime = Date.now() + remainingTime * 1000;
				onUpdate({
					isPaused: false,
					startTime: Date.now(),
					endTime: newEndTime,
				});
			} else {
				onUpdate({
					isPaused: true,
					remainingTime: remainingTime,
				});
			}
		};

		const handleReset = () => {
			if (!onUpdate) return;

			onUpdate({
				isRunning: false,
				isPaused: false,
				remainingTime: properties.duration,
				startTime: undefined,
				endTime: undefined,
			});
		};

		const isFinished = remainingTime === 0;
		const showPlayButton = !properties.isRunning || properties.isPaused;

		return (
			<g transform={`translate(${element.x}, ${element.y})`}>
				<rect
					width={element.width}
					height={element.height}
					fill="black"
					stroke="#e2e8f0"
					strokeWidth={2}
					rx={8}
					className="drop-shadow-md"
				/>

				{properties.title && (
					<text
						x={element.width / 2}
						y={25}
						textAnchor="middle"
						fontSize="14"
						fontWeight="600"
						fill="#1f2937"
					>
						{properties.title}
					</text>
				)}

				<text
					x={element.width / 2}
					y={properties.title ? 55 : 40}
					textAnchor="middle"
					fontSize="28"
					fontWeight="bold"
					fill={isFinished ? "#ef4444" : "white"}
					fontFamily="monospace"
					className="text-red-500"
				>
					{formatTime(remainingTime)}
				</text>

				<g
					transform={`translate(${element.width / 2 - 40}, ${properties.title ? 70 : 55})`}
				>
					{/** biome-ignore lint/a11y/noStaticElementInteractions: we need to be able to click on the rect */}
					<rect
						x={0}
						y={0}
						width={32}
						height={32}
						fill={showPlayButton ? "#10b981" : "#f59e0b"}
						rx={6}
						className="cursor-pointer hover:opacity-80"
						onClick={handlePlayPause}
					/>
					<g transform="translate(16, 16)">
						{showPlayButton ? (
							<Play size={16} fill="white" stroke="white" x={-8} y={-8} />
						) : (
							<Pause size={16} fill="white" stroke="white" x={-8} y={-8} />
						)}
					</g>

					{/** biome-ignore lint/a11y/noStaticElementInteractions: we need to be able to click on the rect */}
					<rect
						x={48}
						y={0}
						width={32}
						height={32}
						fill="#6b7280"
						rx={6}
						className="cursor-pointer hover:opacity-80"
						onClick={handleReset}
					/>
					<g transform="translate(64, 16)">
						<RotateCcw size={16} stroke="white" x={-8} y={-8} />
					</g>
				</g>

				{/* Pin button in top-right corner */}
				{api && (
					<g transform={`translate(${element.width - 22}, 2)`}>
						{/** biome-ignore lint/a11y/noStaticElementInteractions: we need to be able to click on the rect */}
						<rect
							x={0}
							y={0}
							width={18}
							height={18}
							fill={isPinned ? "#3b82f6" : "#6b7280"}
							rx={3}
							className="cursor-pointer hover:opacity-80"
							onClick={handlePin}
						/>
						<g transform="translate(9, 9)">
							{isPinned ? (
								<Pin size={10} fill="white" stroke="white" x={-5} y={-5} />
							) : (
								<PinOff size={10} fill="white" stroke="white" x={-5} y={-5} />
							)}
						</g>
					</g>
				)}

				{isFinished && (
					<circle
						cx={element.width - 12}
						cy={25}
						r={6}
						fill="#ef4444"
						className="animate-pulse"
					/>
				)}
			</g>
		);
	},
);
