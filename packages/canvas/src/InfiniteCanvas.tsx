import { useRef, useCallback, useEffect } from "react";
import { useViewport } from "./hooks/useViewport";
import { PositionDisplay } from "./components/PositionDisplay";
import { CANVAS_CONSTANTS } from "@/constants";
import Toolbar from "./components/Toolbar";

export const InfiniteCanvas: React.FC = () => {
	const svgRef = useRef<SVGSVGElement>(null);
	const {
		dimensions,
		getViewBoxString,
		getCursor,
		startDrag,
		updateDrag,
		endDrag,
		zoomAt,
	} = useViewport();

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			startDrag({ x: e.clientX, y: e.clientY });
		},
		[startDrag],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			updateDrag({ x: e.clientX, y: e.clientY });
		},
		[updateDrag],
	);

	const handleMouseUp = useCallback(() => {
		endDrag();
	}, [endDrag]);

	const handleMouseLeave = useCallback(() => {
		endDrag();
	}, [endDrag]);

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const centerX = e.clientX - rect.left;
			const centerY = e.clientY - rect.top;

			// Detect pinch gesture (ctrlKey is set during pinch on trackpad)
			if (e.ctrlKey) {
				// Pinch gesture - use deltaY directly but with different scaling
				zoomAt(-e.deltaY * 2, centerX, centerY);
			} else {
				// Regular scroll - use deltaY
				zoomAt(-e.deltaY, centerX, centerY);
			}
		},
		[zoomAt],
	);

	// Comprehensive zoom prevention and custom handling
	useEffect(() => {
		const element = svgRef.current?.parentElement; // Use parent div
		if (!element) return;

		// Prevent all zoom-related events
		const preventDefault = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		};

		// Handle wheel events with more specific pinch detection
		const handleWheelCapture = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			const rect = svgRef.current?.getBoundingClientRect();
			if (!rect) return;

			const centerX = e.clientX - rect.left;
			const centerY = e.clientY - rect.top;

			// More reliable pinch detection
			if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 10) {
				zoomAt(-e.deltaY, centerX, centerY);
			}
		};

		// Prevent keyboard zoom shortcuts
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				(e.ctrlKey || e.metaKey) &&
				(e.key === "+" || e.key === "-" || e.key === "0" || e.key === "=")
			) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Add all event listeners with capture: true for higher priority
		element.addEventListener("wheel", handleWheelCapture, {
			passive: false,
			capture: true,
		});
		element.addEventListener("gesturestart", preventDefault, {
			passive: false,
			capture: true,
		});
		element.addEventListener("gesturechange", preventDefault, {
			passive: false,
			capture: true,
		});
		element.addEventListener("gestureend", preventDefault, {
			passive: false,
			capture: true,
		});
		document.addEventListener("keydown", handleKeyDown, {
			passive: false,
			capture: true,
		});

		// Also prevent on window level
		const preventWindowZoom = (e: Event) => {
			if (element.contains(e.target as Node)) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		window.addEventListener("gesturestart", preventWindowZoom, {
			passive: false,
			capture: true,
		});
		window.addEventListener("gesturechange", preventWindowZoom, {
			passive: false,
			capture: true,
		});
		window.addEventListener("gestureend", preventWindowZoom, {
			passive: false,
			capture: true,
		});

		return () => {
			element.removeEventListener("wheel", handleWheelCapture, true);
			element.removeEventListener("gesturestart", preventDefault, true);
			element.removeEventListener("gesturechange", preventDefault, true);
			element.removeEventListener("gestureend", preventDefault, true);
			document.removeEventListener("keydown", handleKeyDown, true);
			window.removeEventListener("gesturestart", preventWindowZoom, true);
			window.removeEventListener("gesturechange", preventWindowZoom, true);
			window.removeEventListener("gestureend", preventWindowZoom, true);
		};
	}, [zoomAt]);

	return (
		<div
			className="relative w-full h-screen overflow-hidden bg-background"
			style={{ touchAction: "none" }}
		>
			<svg
				ref={svgRef}
				width={dimensions.width}
				height={dimensions.height}
				viewBox={getViewBoxString()}
				className="bg-background"
				style={{ cursor: getCursor() }}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
			>
				<title>Infinite Canvas</title>
				<defs>
					<pattern
						id="dots"
						width={CANVAS_CONSTANTS.GRID_SIZE}
						height={CANVAS_CONSTANTS.GRID_SIZE}
						patternUnits="userSpaceOnUse"
					>
						<circle
							cx={CANVAS_CONSTANTS.GRID_SIZE / 2}
							cy={CANVAS_CONSTANTS.GRID_SIZE / 2}
							r={CANVAS_CONSTANTS.DOT_SIZE}
							fill={CANVAS_CONSTANTS.COLORS.GRID_DOT}
							opacity={CANVAS_CONSTANTS.DOT_OPACITY}
						/>
					</pattern>
				</defs>
				<rect
					x={CANVAS_CONSTANTS.CANVAS_OFFSET}
					y={CANVAS_CONSTANTS.CANVAS_OFFSET}
					width={CANVAS_CONSTANTS.CANVAS_SIZE}
					height={CANVAS_CONSTANTS.CANVAS_SIZE}
					fill="url(#dots)"
				/>
			</svg>

			<PositionDisplay />
			<Toolbar />
		</div>
	);
};
