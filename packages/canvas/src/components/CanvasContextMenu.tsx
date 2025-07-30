import type { ContextMenuItem, PluginAPI } from "@jammwork/api";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
	ContextMenuItem as UIContextMenuItem,
} from "@jammwork/ui";
import { CopyIcon, DownloadIcon, TrashIcon } from "lucide-react";
import type React from "react";
import { useCallback, useRef } from "react";
import { useCanvasStore } from "../store";
import { CanvasExporter } from "../utils/canvasExport";

interface CanvasContextMenuProps {
	pluginApi: PluginAPI;
	children: React.ReactNode;
	svgRef: React.RefObject<SVGSVGElement | null>;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
	pluginApi,
	children,
	svgRef,
}) => {
	const elements = useCanvasStore((state) => state.elements);
	const contextMenuItems = pluginApi.getContextMenuItems();
	const canvasExporter = useRef(new CanvasExporter(svgRef));

	const handleCopyAsImage = useCallback(async () => {
		try {
			await canvasExporter.current.copyToClipboard();
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	}, []);

	const handleExportImage = useCallback(async () => {
		try {
			await canvasExporter.current.exportToImage("png");
		} catch (error) {
			console.error("Failed to export image:", error);
		}
	}, []);

	const handleClearCanvas = useCallback(() => {
		// Clear all elements
		for (const [id] of elements) {
			pluginApi.deleteElement(id);
		}
	}, [elements, pluginApi]);

	// Default context menu items
	const defaultItems: ContextMenuItem[] = [
		{
			id: "copy-as-image",
			label: "Copy as Image",
			icon: <CopyIcon />,
			shortcut: "Ctrl+Shift+C",
			onClick: handleCopyAsImage,
		},
		{
			id: "export-to-image",
			label: "Export to Image",
			icon: <DownloadIcon />,
			onClick: handleExportImage,
		},
		...(elements.size > 0
			? [
					{
						id: "separator-default",
						separator: true,
					} as ContextMenuItem,
					{
						id: "clear-canvas",
						label: "Clear Canvas",
						icon: <TrashIcon />,
						shortcut: "Ctrl+Shift+X",
						onClick: handleClearCanvas,
					} as ContextMenuItem,
				]
			: []),
	];

	// Combine default items with plugin items
	const allItems = [...defaultItems, ...contextMenuItems];

	const renderMenuItem = (item: ContextMenuItem) => {
		if (item.separator) {
			return <ContextMenuSeparator key={item.id} />;
		}

		return (
			<UIContextMenuItem
				key={item.id}
				disabled={item.disabled}
				onSelect={() => {
					item.onClick?.();
				}}
				variant={item.id.includes("delete") ? "destructive" : "default"}
			>
				{item.icon && <span className="mr-2">{item.icon}</span>}
				{item.label}
				{item.shortcut && (
					<ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
				)}
			</UIContextMenuItem>
		);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			{allItems.length > 0 && (
				<ContextMenuContent className="w-64">
					{allItems.map(renderMenuItem)}
				</ContextMenuContent>
			)}
		</ContextMenu>
	);
};
