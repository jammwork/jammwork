import { InfiniteCanvas } from "@jammwork/canvas";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Input,
} from "@jammwork/ui";
import { useRef } from "react";
import { useParams } from "react-router-dom";
import { getRandomPastelColor } from "@/lib/colors";
import { useSpace, useUserId } from "@/lib/queries";
import { plugins } from "@/plugins";

function EditorPage() {
	const { spaceId } = useParams() as { spaceId: string };
	const inputRef = useRef<HTMLInputElement>(null);

	// React Query hooks
	const {
		data: userId,
		isLoading: userIdLoading,
		error: userIdError,
	} = useUserId();
	const {
		data: space,
		isLoading: spaceLoading,
		error: spaceError,
	} = useSpace(spaceId);

	const name = localStorage.getItem("name");
	const color = localStorage.getItem("color") ?? getRandomPastelColor();

	const getEnabledPlugins = () => {
		if (!space) return [];
		return plugins.filter((plugin) => space.pluginIds.includes(plugin.id));
	};

	// Loading state
	if (userIdLoading || spaceLoading) {
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<div className="text-lg">
					{userIdLoading ? "Loading user..." : "Loading space..."}
				</div>
			</div>
		);
	}

	// Error state
	if (userIdError || spaceError || !space || !userId) {
		const errorMessage =
			userIdError?.message ||
			spaceError?.message ||
			"Space not found or user not loaded";
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<div className="text-lg text-destructive">{errorMessage}</div>
			</div>
		);
	}

	// Name prompt
	if (!spaceId || !name) {
		return (
			<AlertDialog open>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Enter your name</AlertDialogTitle>
						<AlertDialogDescription>
							Please enter your name to continue.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Input placeholder="Enter your name" ref={inputRef} />
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => {
								localStorage.setItem("name", inputRef.current?.value ?? "");
								localStorage.setItem("color", getRandomPastelColor());
								window.location.reload();
							}}
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}

	// Main render
	return (
		<div className="w-screen h-screen">
			<InfiniteCanvas
				backendUrl={import.meta.env.VITE_BACKEND_URL}
				userId={userId}
				userName={name || userId}
				spaceId={spaceId}
				accentColor={color}
				plugins={getEnabledPlugins()}
				availablePlugins={plugins}
			/>
		</div>
	);
}

export default EditorPage;
