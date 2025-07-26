import { InfiniteCanvas } from "@jammwork/canvas";

function EditorPage() {
	return (
		<div className="w-screen h-screen">
			<InfiniteCanvas
				backendUrl="ws://localhost:1234"
				userId={Math.random().toString(36).substring(2, 15)}
				roomId="my-canvas-room"
				accentColor="#8b5cf6"
			/>
		</div>
	);
}

export default EditorPage;
