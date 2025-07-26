import type { Element, PluginAPI } from "@jammwork/api";
import type React from "react";
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
