import type { Element, PluginAPI } from "@jammwork/api";
import { useEffect, useRef, useState } from "react";

interface TextEditorProps {
	element: Element;
	api: PluginAPI;
	onComplete: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
	element,
	api,
	onComplete,
}) => {
	const [text, setText] = useState((element.properties.text as string) || "");
	const inputRef = useRef<HTMLInputElement>(null);
	const { x, y, width, height } = element;

	// Get the center position for text input
	let centerX: number, centerY: number;
	if (element.type === "circle") {
		centerX = element.properties.centerX as number;
		centerY = element.properties.centerY as number;
	} else {
		centerX = x + width / 2;
		centerY = y + height / 2;
	}

	// Convert canvas position to screen position
	const screenPos = api.canvasToScreen({ x: centerX, y: centerY });

	useEffect(() => {
		// Focus the input when component mounts
		if (inputRef.current) {
			inputRef.current.focus();
			// Use setTimeout to ensure the input is fully rendered before selecting
			setTimeout(() => {
				if (inputRef.current && typeof inputRef.current.select === 'function') {
					inputRef.current.select();
				}
			}, 10);
		}
	}, []);

	const handleSubmit = () => {
		// Update the element with the new text
		api.updateElement(element.id, {
			properties: {
				...element.properties,
				text: text,
			},
		});
		onComplete();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onComplete();
		}
	};

	const handleBlur = () => {
		handleSubmit();
	};

	return (
		<div
			style={{
				position: "absolute",
				left: screenPos.x - 50, // Center the input
				top: screenPos.y - 10,
				width: 100,
				zIndex: 1000,
				pointerEvents: "auto",
			}}
		>
			<input
				ref={inputRef}
				type="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				style={{
					width: "100%",
					padding: "4px 8px",
					border: "1px solid #ccc",
					borderRadius: "4px",
					fontSize: "14px",
					textAlign: "center",
					background: "white",
					boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
				}}
				placeholder="Enter text..."
			/>
		</div>
	);
};
