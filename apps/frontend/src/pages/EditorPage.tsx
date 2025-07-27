import { InfiniteCanvas } from "@jammwork/canvas";
import { ScreenSharePlugin } from "@jammwork/plugin-screenshare";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Input } from "@jammwork/ui";
import { useRef } from "react";
import { useParams } from "react-router-dom";
import { getRandomPastelColor } from "@/lib/colors";


function EditorPage() {
	const { roomId } = useParams();
	const inputRef = useRef<HTMLInputElement>(null);

	const name = localStorage.getItem("name");
	const color = localStorage.getItem("color") ?? getRandomPastelColor();

	if (!roomId || !name) {
		return <AlertDialog open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Enter your name</AlertDialogTitle>
					<AlertDialogDescription>
						Please enter your name to continue.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Input placeholder='Enter your name' ref={inputRef} />
				<AlertDialogFooter>
					<AlertDialogAction onClick={() => {
						localStorage.setItem("name", inputRef.current?.value ?? "");
						localStorage.setItem("color", getRandomPastelColor());
						window.location.reload();
					}}>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	}

	return (
		<div className="w-screen h-screen">
			<InfiniteCanvas
				backendUrl="ws://localhost:1234"
				userId={name}
				roomId={roomId}
				accentColor={color}
				plugins={[ScreenSharePlugin]}
			/>
		</div>
	);
}

export default EditorPage;
