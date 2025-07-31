import type { PluginAPI, ToolDefinition } from "@jammwork/api";
import { Button } from "@jammwork/ui";
import { Hand, MousePointer2 } from "lucide-react";
import { useCanvasStore } from "@/store";

interface ToolbarProps {
	pluginApi?: PluginAPI;
}

function Toolbar({ pluginApi }: ToolbarProps) {
	const { toolState, setActiveTool } = useCanvasStore();

	// Core tools
	const coreTools: ToolDefinition[] = [
		{
			id: "select",
			name: "Select",
			icon: <MousePointer2 size={16} />,
			cursor: "default",
		},
		{
			id: "pan",
			name: "Pan & Zoom",
			icon: <Hand size={16} />,
			cursor: "grab",
		},
	];

	// Get main tools for toolbar (excludes secondary tools)
	const mainPluginTools = pluginApi
		? Array.from(pluginApi.getMainTools().values())
		: [];

	// Combine tools for main toolbar (1 is a separator)
	const mainToolbarTools = [...coreTools, 1, ...mainPluginTools];

	// Find secondary tools for the active tool
	let secondaryTools: ToolDefinition[] = [];

	if (pluginApi) {
		// Check if the active tool is a main tool with secondary tools
		const mainTool = pluginApi.getMainTools().get(toolState.activeTool);
		if (mainTool) {
			secondaryTools = pluginApi.getSecondaryTools(toolState.activeTool);
		} else {
			// Check if the active tool is a secondary tool, and find its parent
			const mainTools = Array.from(pluginApi.getMainTools().values());
			const parentTool = mainTools.find((tool) =>
				pluginApi
					.getSecondaryTools(tool.id)
					.some((subTool) => subTool.id === toolState.activeTool),
			);
			if (parentTool) {
				secondaryTools = pluginApi.getSecondaryTools(parentTool.id);
			}
		}
	}

	const handleToolClick = (toolId: string) => {
		setActiveTool(toolId);
	};

	return (
		<div className="fixed bottom-3 left-0 right-0 flex flex-col gap-1 justify-center items-center pointer-events-none">
			{/* Secondary toolbar - shown above main toolbar when available */}
			{secondaryTools.length > 0 && (
				<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center pointer-events-auto">
					{secondaryTools.map((tool) => (
						<Button
							key={tool.id}
							variant={toolState.activeTool === tool.id ? "default" : "ghost"}
							size="icon"
							onClick={() => handleToolClick(tool.id)}
							title={tool.name}
						>
							{tool.icon}
						</Button>
					))}
				</div>
			)}

			{/* Main toolbar */}
			<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center pointer-events-auto">
				{mainToolbarTools.map((tool) => {
					if (typeof tool === "number") {
						return (
							<div
								key={tool}
								className="w-[1px] mx-2 h-6 bg-muted-foreground/30 rounded-full"
							/>
						);
					}
					// Check if this tool should be highlighted
					let isHighlighted = toolState.activeTool === tool.id;

					// If the active tool is a secondary tool, highlight the parent tool
					if (!isHighlighted && pluginApi) {
						const secondaryTools = pluginApi.getSecondaryTools(tool.id);
						isHighlighted = secondaryTools.some(
							(subTool) => subTool.id === toolState.activeTool,
						);
					}

					// Check if plugin has manually set this tool to be highlighted
					if (!isHighlighted && pluginApi) {
						isHighlighted = pluginApi.isToolHighlighted(tool.id);
					}

					return (
						<Button
							key={tool.id}
							variant={isHighlighted ? "default" : "ghost"}
							size="icon"
							onClick={() => handleToolClick(tool.id)}
							title={tool.name}
						>
							{tool.icon}
						</Button>
					);
				})}
			</div>
		</div>
	);
}

export default Toolbar;
