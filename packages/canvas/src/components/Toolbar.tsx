import { Button } from "@jammwork/ui";
import { useCanvasStore } from "../canvasStore";
import { MousePointer2, Hand } from "lucide-react";
import type { PluginAPI, ToolDefinition } from "../plugin";

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

	// Combine tools for main toolbar
	const mainToolbarTools = [...coreTools, ...mainPluginTools];

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
		<div className="fixed bottom-3 left-0 right-0 flex flex-col gap-1 justify-center items-center">
			{/* Secondary toolbar - shown above main toolbar when available */}
			{secondaryTools.length > 0 && (
				<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center">
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
			<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center">
				{mainToolbarTools.map((tool) => {
					// Check if this tool should be highlighted
					let isHighlighted = toolState.activeTool === tool.id;

					// If the active tool is a secondary tool, highlight the parent tool
					if (!isHighlighted && pluginApi) {
						const secondaryTools = pluginApi.getSecondaryTools(tool.id);
						isHighlighted = secondaryTools.some(
							(subTool) => subTool.id === toolState.activeTool,
						);
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
