import { InfiniteCanvas } from "@jammwork/canvas";
import { ScreenSharePlugin } from "@jammwork/plugin-screenshare";
import { useParams } from "react-router-dom";
import { getRandomPastelColor } from "@/lib/colors";

function EditorPage() {
	const { roomId } = useParams();

	const name = localStorage.getItem("name");
	const color = localStorage.getItem("color") ?? getRandomPastelColor();

	if (!roomId || !name) {
		return <div>Room not found</div>;
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
