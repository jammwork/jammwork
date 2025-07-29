import type { PluginAPI } from "@jammwork/api";
import Peer, { type MediaConnection } from "peerjs";
import { useEffect, useRef } from "react";
import { streamManager } from "./streamManager";

export const usePeerConnection = (api: PluginAPI) => {
	const peer = useRef<Peer | null>(null);
	const peers = useRef<Record<string, MediaConnection>>({});
	const localStream = useRef<MediaStream | null>(null);
	const peerReady = useRef<boolean>(false);
	const knownUsers = useRef<Set<string>>(new Set());

	const userId = api.getUserId();
	const roomId = api.getRoomId();
	const awareness = api.getAwareness();

	// Initialize peer connection
	useEffect(() => {
		if (peer.current) return;

		// TODO: Replace with your PeerJS server URL
		const newPeer = new Peer(`${userId}_${roomId}`, {
			config: {
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:19302" },
				],
			},
		});
		peer.current = newPeer;

		newPeer.on("open", () => {
			peerReady.current = true;
		});

		newPeer.on("error", () => {});

		newPeer.on("call", (call) => {
			// Answer the call with empty stream (we're receiving, not sending)
			call.answer(new MediaStream());

			call.on("stream", (remoteStream) => {
				// Extract the caller's user ID from the peer ID (format: userId_roomId)
				const callerUserId = call.peer.split("_")[0];

				// Use a predictable stream ID based on the caller's user ID
				// This ensures the element can find the stream even after reload
				const predictableStreamId = `stream_${callerUserId}`;

				streamManager.addStream(predictableStreamId, remoteStream);
			});

			peers.current[call.peer] = call;

			call.on("close", () => {
				delete peers.current[call.peer];
			});

			call.on("error", () => {
				delete peers.current[call.peer];
			});
		});
	}, [userId, roomId]);

	// Listen for new users joining and call them if we're broadcasting
	useEffect(() => {
		if (!awareness) return;

		const handleAwarenessChange = () => {
			// Only handle new users if we're actively broadcasting
			if (!localStream.current) return;

			const states = Array.from(awareness.getStates().values());
			const currentUserIds = new Set<string>();

			// Collect all current user IDs
			// biome-ignore lint/suspicious/noExplicitAny: we don't know the type of the state
			states.forEach((state: any) => {
				const remoteUser = state.user;
				if (remoteUser && remoteUser.id !== userId) {
					currentUserIds.add(remoteUser.id);
				}
			});

			// Find truly new users (not seen before and not already being called)
			currentUserIds.forEach((remoteUserId) => {
				if (!knownUsers.current.has(remoteUserId)) {
					knownUsers.current.add(remoteUserId);

					// Only call if we're ready and not already calling this user
					const remotePeerId = `${remoteUserId}_${roomId}`;
					if (
						localStream.current &&
						peer.current &&
						peerReady.current &&
						!peers.current[remotePeerId]
					) {
						// Add a small delay to ensure the remote peer is ready
						setTimeout(() => {
							if (localStream.current && !peers.current[remotePeerId]) {
								callUser(remoteUserId, localStream.current);
							}
						}, 1000);
					}
				}
			});

			// Clean up known users who are no longer present
			const removedUsers = Array.from(knownUsers.current).filter(
				(userId) => !currentUserIds.has(userId),
			);
			removedUsers.forEach((userId) => {
				knownUsers.current.delete(userId);
			});
		};

		awareness.on("change", handleAwarenessChange);
		return () => awareness.off("change", handleAwarenessChange);
	}, [awareness, userId, roomId]);

	const callUser = (remoteUserId: string, stream: MediaStream) => {
		const remotePeerId = `${remoteUserId}_${roomId}`;

		const call = peer.current?.call(remotePeerId, stream);
		if (call) {
			peers.current[remotePeerId] = call;

			call.on("close", () => {
				delete peers.current[remotePeerId];
			});

			call.on("error", () => {
				delete peers.current[remotePeerId];
			});
		}
	};

	const broadcastStream = (stream: MediaStream) => {
		localStream.current = stream;

		if (!awareness) {
			return;
		}

		if (!peer.current || !peerReady.current) {
			setTimeout(() => broadcastStream(stream), 2000);
			return;
		}

		const states = Array.from(awareness.getStates().values());

		// Track all current users and call them
		// biome-ignore lint/suspicious/noExplicitAny: we don't know the type of the state
		states.forEach((state: any) => {
			const remoteUser = state.user;
			if (remoteUser && remoteUser.id !== userId) {
				knownUsers.current.add(remoteUser.id); // Track this user
				callUser(remoteUser.id, stream);
			}
		});
	};

	const stopBroadcast = () => {
		Object.values(peers.current).forEach((peer) => peer.close());
		peers.current = {};
		localStream.current = null;
		knownUsers.current.clear();
	};

	return {
		broadcastStream,
		stopBroadcast,
	};
};
