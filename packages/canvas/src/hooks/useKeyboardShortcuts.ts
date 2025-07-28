import type { PluginAPI } from "@jammwork/api";
import { useEffect } from "react";
import { useCanvasStore } from "@/store";
import { createSelectTool } from "@/tools/SelectTool";

interface UseKeyboardShortcutsProps {
	pluginApi?: PluginAPI;
}

export const useKeyboardShortcuts = ({
	pluginApi,
}: UseKeyboardShortcutsProps) => {
	const selectTool = pluginApi ? createSelectTool(pluginApi) : null;

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only handle when not in input fields
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			// Check Command/Ctrl + R
			if (e.code === "KeyR" && e.metaKey) {
				e.preventDefault();
				e.stopPropagation();
				window.location.reload();
				return;
			}

			const { setActiveTool, toolState, setSpacePressed } =
				useCanvasStore.getState();

			// Handle space bar for temporary panning
			if (e.code === "Space" && !toolState.isSpacePressed) {
				setSpacePressed(true);
				e.preventDefault();
				return;
			}

			// Don't handle other keys if space is pressed (to allow space+drag panning)
			if (toolState.isSpacePressed) return;

			// Handle global shortcuts FIRST (highest priority)
			const { undo, redo, canUndo, canRedo } = useCanvasStore.getState();

			// Undo/Redo shortcuts
			if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (e.shiftKey) {
					// Redo (Ctrl+Shift+Z or Cmd+Shift+Z)
					if (canRedo()) {
						redo();
					}
				} else {
					// Undo (Ctrl+Z or Cmd+Z)
					if (canUndo()) {
						undo();
					}
				}
				return;
			}

			// Alternative redo shortcut
			if (e.key.toLowerCase() === "y" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (canRedo()) {
					redo();
				}
				return;
			}

			// Handle canvas tool switching shortcuts
			switch (e.key.toLowerCase()) {
				case "v":
					setActiveTool("select");
					e.preventDefault();
					return;
				case "h":
					setActiveTool("pan");
					e.preventDefault();
					return;
				case "d":
					setActiveTool("draw");
					e.preventDefault();
					return;
				case "r":
					setActiveTool("rectangle");
					e.preventDefault();
					return;
			}

			// Then check if the current tool handles the keydown
			if (toolState.activeTool === "select" && selectTool?.onKeyDown) {
				selectTool.onKeyDown(e);
				return;
			}

			// Finally check if any plugin tool handles the keydown
			if (pluginApi) {
				const registeredTools = pluginApi.getRegisteredTools();
				const activeTool = Array.from(registeredTools.values()).find(
					(tool) => tool.id === toolState.activeTool,
				);

				if (activeTool?.onKeyDown) {
					activeTool.onKeyDown(e);
					return;
				}
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			// Only handle when not in input fields
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			const { setSpacePressed, setSpacePanning } = useCanvasStore.getState();

			// Handle space bar release
			if (e.code === "Space") {
				setSpacePressed(false);
				setSpacePanning(false);
				e.preventDefault();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [selectTool, pluginApi]);
};
