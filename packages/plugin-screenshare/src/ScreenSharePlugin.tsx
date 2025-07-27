import type { Disposable, Plugin, PluginAPI } from "@jammwork/api";
import { Monitor } from "lucide-react";
import React from "react";
import { ScreenShareLayer } from "./ScreenShareLayer";
import { ScreenShareRenderer } from "./ScreenShareRenderer";
import { setScreenShareImplementation, useScreenShareStore } from "./store";
import { streamManager } from "./streamManager";
import { usePeerConnection } from "./usePeerConnection";

let disposables: Disposable[] = [];

const ScreenShareManager: React.FC<{ api: PluginAPI }> = ({ api }) => {
	const { broadcastStream, stopBroadcast } = usePeerConnection(api);

	// This component doesn't render anything, it just manages the PeerJS connection
	React.useEffect(() => {
		const startScreenShare = async (): Promise<string> => {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});

			// Use predictable stream ID based on user ID
			const userId = api.getUserId();
			const predictableStreamId = `stream_${userId}`;

			// Add to local stream manager with predictable ID
			streamManager.addStream(predictableStreamId, stream);

			// Broadcast to peers
			broadcastStream(stream);

			// Highlight the screen share tool to indicate active sharing
			api.setToolHighlight("screenshare", true);

			// Create canvas element
			const element = {
				type: "screenshare",
				x: 100,
				y: 100,
				width: 640,
				height: 480,
				properties: {
					streamId: predictableStreamId,
					userId,
					title: `${userId}'s Screen`,
				},
			};

			const elementId = api.createElement(element);

			// Handle stream end
			stream.getVideoTracks()[0].onended = () => {
				streamManager.removeStream(predictableStreamId);
				stopBroadcast();
				api.deleteElement(elementId);
				// Remove highlight when sharing stops
				api.setToolHighlight("screenshare", false);
			};

			return elementId;
		};

		const stopScreenShare = (): void => {
			stopBroadcast();
			// Remove highlight when manually stopping
			api.setToolHighlight("screenshare", false);
		};

		// Set the implementation in the Zustand store
		setScreenShareImplementation(startScreenShare, stopScreenShare);

		return () => {
			// Reset store when component unmounts
			setScreenShareImplementation(
				async () => {
					throw new Error("Screen share not available");
				},
				() => {},
			);
		};
	}, [api, broadcastStream, stopBroadcast]);

	return null;
};

export const ScreenSharePlugin: Plugin = {
	id: "screenshare",
	name: "Screen Share",
	version: "1.0.0",
	description: "Share your screen with others in real-time",
	author: "JammWork",

	activate: async (api: PluginAPI) => {
		// Register screen share element type
		const elementDisposable = api.registerElementType("screenshare", {
			render: (element) => <ScreenShareRenderer element={element} />,
			getBounds: (element) => ({
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
			}),
		});

		// Register screen share tool
		const toolDisposable = api.registerTool({
			id: "screenshare",
			name: "Screen Share",
			icon: <Monitor size={16} />,
			cursor: "default",
			onActivate: async () => {
				const { startScreenShare } = useScreenShareStore.getState();
				await startScreenShare();
			},
		});

		// Register layer component for rendering
		const layerDisposable = api.registerLayerComponent(() => (
			<ScreenShareLayer api={api} />
		));

		// Register the invisible manager component
		const managerDisposable = api.registerLayerComponent(() => (
			<ScreenShareManager api={api} />
		));

		disposables.push(
			elementDisposable,
			toolDisposable,
			layerDisposable,
			managerDisposable,
		);
	},

	deactivate: async () => {
		disposables.forEach((disposable) => disposable.dispose());
		disposables = [];
	},
};
