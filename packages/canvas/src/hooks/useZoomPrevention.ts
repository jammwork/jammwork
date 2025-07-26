import { useEffect, RefObject } from "react";

interface UseZoomPreventionProps {
	svgRef: RefObject<SVGSVGElement | null>;
	zoomAt: (deltaZoom: number, centerX: number, centerY: number) => void;
}

export const useZoomPrevention = ({
	svgRef,
	zoomAt,
}: UseZoomPreventionProps) => {
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
	}, [zoomAt, svgRef]);
};
