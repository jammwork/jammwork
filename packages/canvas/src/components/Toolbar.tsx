import { Button } from "@jammwork/ui";
import { useCanvasStore } from "../canvasStore";
import { MousePointer2, Hand } from "lucide-react";

interface ToolbarProps {
	pluginApi?: {
		getRegisteredTools: () => Map<string, any>;
	};
}

function Toolbar({ pluginApi }: ToolbarProps) {
	const { toolState, setActiveTool } = useCanvasStore();

	// Core tools
	const coreTools = [
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

	// Get plugin tools
	const pluginTools = pluginApi
		? Array.from(pluginApi.getRegisteredTools().values())
		: [];

	// Combine all tools
	const allTools = [...coreTools, ...pluginTools];

	const handleToolClick = (toolId: string) => {
		setActiveTool(toolId);
	};

	return (
		<div className="fixed bottom-3 left-0 right-0 flex flex-col gap-1 justify-center items-center">
			<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center">
				{allTools.map((tool) => (
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
		</div>
	);
}

export default Toolbar;
