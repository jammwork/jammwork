import type React from "react";
import type { Element, PluginAPI } from "../../../plugin";
import { CircleRenderer } from "../renderers/CircleRenderer";

export const createCircleLayer =
	(api: PluginAPI): React.FC =>
	() => {
		const elements = api.getElements();
		const circles = Array.from(elements.values()).filter(
			(element): element is Element => element.type === "circle",
		);

		return (
			<g className="circles-layer">
				{circles.map((element) => (
					<CircleRenderer key={element.id} element={element} />
				))}
			</g>
		);
	};
