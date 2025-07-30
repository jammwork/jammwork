export class CanvasExporter {
	constructor(private svgRef: React.RefObject<SVGSVGElement | null>) {}

	private async convertSvgToCanvas(): Promise<HTMLCanvasElement> {
		const svg = this.svgRef.current;
		if (!svg) {
			throw new Error("SVG element not found");
		}

		// Get the SVG's viewBox to determine the canvas size
		const viewBox = svg.viewBox.baseVal;
		const width = viewBox.width || svg.clientWidth;
		const height = viewBox.height || svg.clientHeight;

		// Clone the SVG to avoid modifying the original
		const svgClone = svg.cloneNode(true) as SVGSVGElement;

		// Set explicit dimensions on the clone
		svgClone.setAttribute("width", width.toString());
		svgClone.setAttribute("height", height.toString());

		// Convert SVG to string
		const svgData = new XMLSerializer().serializeToString(svgClone);
		const svgBlob = new Blob([svgData], {
			type: "image/svg+xml;charset=utf-8",
		});
		const svgUrl = URL.createObjectURL(svgBlob);

		// Create canvas and draw the SVG
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to get canvas context");
		}

		canvas.width = width;
		canvas.height = height;

		// Create an image and draw it to canvas
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				ctx.fillStyle = "white"; // Set background color
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0);
				URL.revokeObjectURL(svgUrl);
				resolve(canvas);
			};
			img.onerror = () => {
				URL.revokeObjectURL(svgUrl);
				reject(new Error("Failed to load SVG as image"));
			};
			img.src = svgUrl;
		});
	}

	async exportToImage(
		format: "png" | "jpeg" = "png",
		quality = 0.9,
	): Promise<void> {
		try {
			const canvas = await this.convertSvgToCanvas();

			// Convert to blob and download
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						throw new Error("Failed to create image blob");
					}

					const url = URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.download = `canvas-export.${format}`;
					link.href = url;
					link.click();
					URL.revokeObjectURL(url);
				},
				`image/${format}`,
				quality,
			);
		} catch (error) {
			console.error("Export failed:", error);
			throw error;
		}
	}

	async copyToClipboard(): Promise<void> {
		try {
			if (!navigator.clipboard || !window.ClipboardItem) {
				throw new Error("Clipboard API not supported");
			}

			const canvas = await this.convertSvgToCanvas();

			// Convert canvas to blob
			return new Promise((resolve, reject) => {
				canvas.toBlob(async (blob) => {
					if (!blob) {
						reject(new Error("Failed to create image blob"));
						return;
					}

					try {
						const clipboardItem = new ClipboardItem({ "image/png": blob });
						await navigator.clipboard.write([clipboardItem]);
						resolve();
					} catch (error) {
						reject(error);
					}
				}, "image/png");
			});
		} catch (error) {
			console.error("Copy to clipboard failed:", error);
			throw error;
		}
	}
}
