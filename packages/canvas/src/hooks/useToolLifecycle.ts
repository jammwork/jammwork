import type { PluginAPI } from "@jammwork/api";
import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/store";

interface UseToolLifecycleProps {
	pluginApi: PluginAPI;
}

export const useToolLifecycle = ({ pluginApi }: UseToolLifecycleProps) => {
	const { toolState } = useCanvasStore();
	const previousToolRef = useRef<string | null>(null);

	useEffect(() => {
		if (!pluginApi) return;

		const currentTool = toolState.activeTool;
		const previousTool = previousToolRef.current;

		// Skip on initial mount when previousTool is null
		if (previousTool === null) {
			previousToolRef.current = currentTool;

			// Call onActivate for the initial tool if it has one
			const registeredTools = pluginApi.getRegisteredTools();
			const initialTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === currentTool,
			);

			if (initialTool?.onActivate) {
				try {
					initialTool.onActivate();
				} catch (error) {
					console.error(
						`Error activating initial tool "${currentTool}":`,
						error,
					);
				}
			}

			return;
		}

		// If tool hasn't changed, do nothing
		if (currentTool === previousTool) {
			return;
		}

		const registeredTools = pluginApi.getRegisteredTools();

		// Deactivate previous tool
		if (previousTool) {
			const prevTool = Array.from(registeredTools.values()).find(
				(tool) => tool.id === previousTool,
			);

			if (prevTool?.onDeactivate) {
				try {
					prevTool.onDeactivate();
				} catch (error) {
					console.error(`Error deactivating tool "${previousTool}":`, error);
				}
			}
		}

		// Activate new tool
		const newTool = Array.from(registeredTools.values()).find(
			(tool) => tool.id === currentTool,
		);

		if (newTool?.onActivate) {
			try {
				newTool.onActivate();
			} catch (error) {
				console.error(`Error activating tool "${currentTool}":`, error);
			}
		}

		// Update the ref for next comparison
		previousToolRef.current = currentTool;
	}, [toolState.activeTool]);
};
