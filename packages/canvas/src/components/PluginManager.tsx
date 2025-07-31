import type { Plugin } from "@jammwork/api";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Switch,
} from "@jammwork/ui";
import { SettingsIcon } from "lucide-react";
import React, { useState } from "react";

interface PluginManagerProps {
	backendUrl: string;
	spaceId: string;
	currentPlugins: string[];
	availablePlugins: Plugin[];
	onPluginsUpdated: () => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({
	backendUrl,
	spaceId,
	currentPlugins,
	availablePlugins,
	onPluginsUpdated,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [pendingPlugins, setPendingPlugins] =
		useState<string[]>(currentPlugins);
	const [isLoading, setIsLoading] = useState(false);

	// Update pending plugins when current plugins change
	React.useEffect(() => {
		setPendingPlugins(currentPlugins);
	}, [currentPlugins]);

	const handleTogglePlugin = (pluginId: string, checked: boolean) => {
		setPendingPlugins((prev) => {
			if (checked) {
				return prev.includes(pluginId) ? prev : [...prev, pluginId];
			} else {
				return prev.filter((id) => id !== pluginId);
			}
		});
	};

	const handleSaveChanges = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`${backendUrl}/api/spaces/${spaceId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					pluginIds: pendingPlugins,
				}),
			});

			if (response.ok) {
				setIsDialogOpen(false);
				onPluginsUpdated();
				// Reload the page to apply plugin changes
				window.location.reload();
			} else {
				console.error("Failed to update plugins");
			}
		} catch (error) {
			console.error("Error updating plugins:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setPendingPlugins(currentPlugins);
		setIsDialogOpen(false);
	};

	const hasChanges =
		JSON.stringify(pendingPlugins.sort()) !==
		JSON.stringify(currentPlugins.sort());

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="icon">
					<SettingsIcon className="w-4 h-4" />
					<span className="sr-only">Manage plugins</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Manage Plugins</DialogTitle>
					<DialogDescription>
						Enable or disable plugins for this space. The page will reload to
						apply changes.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-2">
					{availablePlugins.map((plugin) => (
						<div
							key={plugin.id}
							className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
						>
							<Switch
								id={`plugin-${plugin.id}`}
								checked={pendingPlugins.includes(plugin.id)}
								onCheckedChange={(checked) =>
									handleTogglePlugin(plugin.id, checked)
								}
							/>
							<label
								htmlFor={`plugin-${plugin.id}`}
								className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{plugin.name || plugin.id}
							</label>
						</div>
					))}
					{availablePlugins.length === 0 && (
						<div className="text-sm text-muted-foreground py-4 text-center">
							No plugins available
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleSaveChanges}
						disabled={isLoading || !hasChanges}
					>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
