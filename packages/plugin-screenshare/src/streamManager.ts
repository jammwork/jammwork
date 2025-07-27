class StreamManager {
	private streams = new Map<string, MediaStream>();
	private subscribers = new Map<
		string,
		Set<(stream: MediaStream | null) => void>
	>();

	addStream(streamId: string, stream: MediaStream): void {
		this.streams.set(streamId, stream);
		const subscribers = this.subscribers.get(streamId);
		if (subscribers) {
			subscribers.forEach((callback) => callback(stream));
		}
	}

	removeStream(streamId: string): void {
		this.streams.delete(streamId);
		const subscribers = this.subscribers.get(streamId);
		if (subscribers) {
			subscribers.forEach((callback) => callback(null));
		}
	}

	getStream(streamId: string): MediaStream | undefined {
		return this.streams.get(streamId);
	}

	subscribe(
		streamId: string,
		callback: (stream: MediaStream | null) => void,
	): () => void {
		if (!this.subscribers.has(streamId)) {
			this.subscribers.set(streamId, new Set());
		}

		const subscribers = this.subscribers.get(streamId)!;
		subscribers.add(callback);

		// Immediately call with current stream if available
		const currentStream = this.streams.get(streamId);
		if (currentStream) {
			callback(currentStream);
		}

		// Return unsubscribe function
		return () => {
			subscribers.delete(callback);
			if (subscribers.size === 0) {
				this.subscribers.delete(streamId);
			}
		};
	}
}

export const streamManager = new StreamManager();
