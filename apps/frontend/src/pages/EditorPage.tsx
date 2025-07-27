import { InfiniteCanvas } from "@jammwork/canvas";
import { ScreenSharePlugin } from "@jammwork/plugin-screenshare";
import { useParams } from "react-router-dom";

function EditorPage() {
	const { roomId } = useParams();

	const name = localStorage.getItem("name");

	if (!roomId || !name) {
		return <div>Room not found</div>;
	}

	return (
		<div className="w-screen h-screen">
			<InfiniteCanvas
				backendUrl="ws://localhost:1234"
				userId={name}
				roomId={roomId}
				accentColor="#8b5cf6"
				plugins={[ScreenSharePlugin]}
			/>
		</div>
	);
}

export default EditorPage;
