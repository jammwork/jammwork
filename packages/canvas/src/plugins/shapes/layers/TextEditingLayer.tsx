import type { Element, PluginAPI } from "@jammwork/api";
import type React from "react";
import { useEffect } from "react";
import { TextEditor } from "../components/TextEditor";
import { useShapeCreationStore } from "../shapesStore";

export const createTextEditingLayer = (api: PluginAPI): React.FC => {
	const TextEditingLayerComponent = () => {
		const { isEditing, editingElement } = useShapeCreationStore();

		useEffect(() => {
			const handleElementDoubleClick = ({
				element,
			}: {
				element: Element;
				position: { x: number; y: number };
				screenPosition: { x: number; y: number };
			}) => {
				if (["rectangle", "circle", "triangle"].includes(element.type)) {
					useShapeCreationStore.getState().startTextEditing(element);
				}
			};

			const handleSelectionChanged = () => {
				const { isEditing, endTextEditing } = useShapeCreationStore.getState();
				if (isEditing) {
					endTextEditing();
				}
			};

			const doubleClickDisposable = api.on(
				"element:doubleclick",
				handleElementDoubleClick,
			);
			const selectionDisposable = api.on(
				"selection:changed",
				handleSelectionChanged,
			);

			return () => {
				doubleClickDisposable.dispose();
				selectionDisposable.dispose();
			};
		}, [api]);

		return (
			<>
				{isEditing && editingElement && (
					<foreignObject
						x={0}
						y={0}
						width="100%"
						height="100%"
						style={{ pointerEvents: 'none' }}
					>
						<div style={{ pointerEvents: 'auto' }}>
							<TextEditor
								element={editingElement}
								api={api}
								onComplete={() => useShapeCreationStore.getState().endTextEditing()}
							/>
						</div>
					</foreignObject>
				)}
			</>
		);
	};

	TextEditingLayerComponent.displayName = "TextEditingLayer";
	return TextEditingLayerComponent;
};
