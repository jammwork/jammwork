import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
	Textarea,
} from "@jammwork/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateSpace } from "@/lib/queries";
import type { CreateSpaceRequest } from "@/lib/types";
import { plugins } from "@/plugins";

type CreateSpaceDialogProps = {
	children: React.ReactNode;
};

function CreateSpaceDialog({ children }: CreateSpaceDialogProps) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState<
		Omit<CreateSpaceRequest, "createdBy">
	>({
		name: "",
		description: "",
		pluginIds: [],
	});

	const createSpaceMutation = useCreateSpace();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			alert("Please enter a space name");
			return;
		}

		if (formData.pluginIds.length === 0) {
			alert("Please select at least one plugin");
			return;
		}

		try {
			const space = await createSpaceMutation.mutateAsync(formData);
			setOpen(false);
			navigate(`/space/${space.id}`);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to create space. Please try again.";
			alert(`Error creating space: ${errorMessage}`);
		}
	};

	const handlePluginToggle = (pluginId: string) => {
		setFormData((prev) => ({
			...prev,
			pluginIds: prev.pluginIds.includes(pluginId)
				? prev.pluginIds.filter((id) => id !== pluginId)
				: [...prev.pluginIds, pluginId],
		}));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Space</DialogTitle>
					<DialogDescription>
						Create a new space to collaborate with your team.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Space Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Enter space name"
							maxLength={100}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Enter space description (optional)"
							maxLength={500}
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label>Plugins *</Label>
						<div className="space-y-2">
							{plugins.map((plugin) => (
								<div key={plugin.id} className="flex items-center space-x-2">
									<Checkbox
										id={plugin.id}
										checked={formData.pluginIds.includes(plugin.id)}
										onCheckedChange={() => handlePluginToggle(plugin.id)}
									/>
									<Label htmlFor={plugin.id} className="text-sm font-normal">
										{plugin.name}
									</Label>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={createSpaceMutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createSpaceMutation.isPending}>
							{createSpaceMutation.isPending ? "Creating..." : "Create Space"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CreateSpaceDialog;
