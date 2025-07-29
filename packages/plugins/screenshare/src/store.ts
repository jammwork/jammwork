import { create } from "zustand";

interface ScreenShareState {
	isSharing: boolean;
	startScreenShare: () => Promise<string>;
	stopScreenShare: () => void;
}

export const useScreenShareStore = create<ScreenShareState>(() => ({
	isSharing: false,
	startScreenShare: async () => {
		throw new Error("startScreenShare not implemented");
	},
	stopScreenShare: () => {
		throw new Error("stopScreenShare not implemented");
	},
}));

// Helper function to set the implementation from the manager component
export const setScreenShareImplementation = (
	startFn: () => Promise<string>,
	stopFn: () => void,
) => {
	useScreenShareStore.setState({
		startScreenShare: async () => {
			useScreenShareStore.setState({ isSharing: true });
			try {
				return await startFn();
			} catch (error) {
				useScreenShareStore.setState({ isSharing: false });
				throw error;
			}
		},
		stopScreenShare: () => {
			stopFn();
			useScreenShareStore.setState({ isSharing: false });
		},
	});
};
