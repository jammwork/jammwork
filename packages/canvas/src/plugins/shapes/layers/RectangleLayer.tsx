import type { Element, PluginAPI } from "@jammwork/api";
import type React from "react";
import { RectangleRenderer } from "../renderers/RectangleRenderer";

export const createRectangleLayer =
	(api: PluginAPI): React.FC =>
	() => {
		const elements = api.getElements();
		const rectangles = Array.from(elements.values()).filter(
			(element): element is Element => element.type === "rectangle",
		);

		return (
			<g className="rectangles-layer">
				{rectangles.map((element) => (
					<RectangleRenderer key={element.id} element={element} />
				))}
			</g>
		);
	};
