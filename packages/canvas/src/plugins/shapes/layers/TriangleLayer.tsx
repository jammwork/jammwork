import type { Element, PluginAPI } from "@jammwork/api";
import type React from "react";
import { TriangleRenderer } from "../renderers/TriangleRenderer";

export const createTriangleLayer =
	(api: PluginAPI): React.FC =>
	() => {
		const elements = api.getElements();
		const triangles = Array.from(elements.values()).filter(
			(element): element is Element => element.type === "triangle",
		);

		return (
			<g className="triangles-layer">
				{triangles.map((element) => (
					<TriangleRenderer key={element.id} element={element} />
				))}
			</g>
		);
	};
