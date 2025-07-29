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
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, spaceApi } from "@/lib/api";
import { getRandomPastelColor } from "@/lib/colors";
import type { Space } from "@/lib/types";
import { plugins } from "@/plugins";

function EditorPage() {
	const { spaceId } = useParams() as { spaceId: string };
	const inputRef = useRef<HTMLInputElement>(null);
	const [space, setSpace] = useState<Space | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const name = localStorage.getItem("name");
	const color = localStorage.getItem("color") ?? getRandomPastelColor();

	useEffect(() => {
		if (spaceId) {
			loadSpace();
		}
	}, [spaceId]);

	const loadSpace = async () => {
		try {
			setLoading(true);
			setError(null);
			const spaceData = await spaceApi.getSpaceById(spaceId);
			setSpace(spaceData);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(`Failed to load space: ${err.message}`);
			} else {
				setError('Failed to load space');
			}
		} finally {
			setLoading(false);
		}
	};

	const getEnabledPlugins = () => {
		if (!space) return [];

		return plugins.filter(plugin =>
			space.pluginIds.includes(plugin.id)
		);
	};

	if (loading) {
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<div className="text-lg">Loading space...</div>
			</div>
		);
	}

	if (error || !space) {
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<div className="text-lg text-destructive">
					{error || 'Space not found'}
				</div>
			</div>
		);
	}


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


	return (
		<div className="w-screen h-screen">
			<InfiniteCanvas
				backendUrl={import.meta.env.VITE_BACKEND_URL}
				userId={name}
				spaceId={spaceId}
				accentColor={color}
				plugins={getEnabledPlugins()}
			/>
		</div>
	);
}

export default EditorPage;
