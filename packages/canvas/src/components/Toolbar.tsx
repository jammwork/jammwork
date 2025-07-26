import { Button } from "@jammwork/ui";
import { useCanvasStore } from "../stores/canvasStore";
import { MousePointer2, Hand, Pen } from "lucide-react";
import type { CanvasTool } from "../stores/canvasStore";

function Toolbar() {
	const { toolState, setActiveTool } = useCanvasStore();

	const tools: Array<{
		id: CanvasTool;
		name: string;
		icon: React.ReactNode;
		shortcut: string;
	}> = [
		{
			id: "select",
			name: "Select",
			icon: <MousePointer2 size={16} />,
			shortcut: "V",
		},
		{
			id: "pan",
			name: "Pan & Zoom",
			icon: <Hand size={16} />,
			shortcut: "H",
		},
		{
			id: "draw",
			name: "Draw",
			icon: <Pen size={16} />,
			shortcut: "P",
		},
	];

	const handleToolClick = (tool: CanvasTool) => {
		setActiveTool(tool);
	};

	return (
		<div className="fixed bottom-3 left-0 right-0 flex flex-col gap-1 justify-center items-center">
			<div className="p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center">
				{tools.map((tool) => (
					<Button
						key={tool.id}
						variant={toolState.activeTool === tool.id ? "default" : "ghost"}
						size="icon"
						onClick={() => handleToolClick(tool.id)}
						title={`${tool.name} (${tool.shortcut})`}
					>
						{tool.icon}
					</Button>
				))}
			</div>
		</div>
	);
}

export default Toolbar;
