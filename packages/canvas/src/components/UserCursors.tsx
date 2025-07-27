import { TinyColor } from "@ctrl/tinycolor";
import { MousePointer2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import { useCanvasStore } from "@/store";

interface UserCursor {
	id: string;
	name: string;
	color: string;
	cursor: { x: number; y: number };
	lastSeen: number;
}

interface UserCursorsProps {
	awareness?: Awareness;
	currentUserId: string;
}

export const UserCursors: React.FC<UserCursorsProps> = ({
	awareness,
	currentUserId,
}) => {
	const [otherUsers, setOtherUsers] = useState<UserCursor[]>([]);
	const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const { viewBox } = useCanvasStore();

	useEffect(() => {
		if (!awareness) return;

		const updateUsers = () => {
			const users: UserCursor[] = [];
			const now = Date.now();

			awareness.getStates().forEach((state) => {
				if (state.user && state.user.id !== currentUserId) {
					users.push({
						id: state.user.id,
						name: state.user.name,
						color: state.user.color,
						cursor: state.user.cursor || { x: 0, y: 0 },
						lastSeen: now,
					});
				}
			});
			setOtherUsers(users);
		};

		// Initial update
		updateUsers();

		// Listen for awareness changes
		awareness.on("change", updateUsers);

		// Set up cleanup interval to remove stale users
		cleanupIntervalRef.current = setInterval(() => {
			const now = Date.now();
			setOtherUsers((prev) =>
				prev.filter((user) => now - user.lastSeen < 10000),
			); // Remove users inactive for 10 seconds
		}, 5000); // Check every 5 seconds

		return () => {
			awareness.off("change", updateUsers);
			if (cleanupIntervalRef.current) {
				clearInterval(cleanupIntervalRef.current);
			}
		};
	}, [awareness, currentUserId]);

	const inverseScale = 1 / viewBox.zoom;

	return (
		<>
			{otherUsers.map((user) => (
				<g
					key={user.id}
					transform={`translate(${user.cursor.x}, ${user.cursor.y}) scale(${inverseScale})`}
				>
					{/* Cursor */}
					<foreignObject
						x={0}
						y={0}
						width="24"
						height="24"
						style={{ pointerEvents: "none" }}
					>
						<div style={{ transform: "translate(-2px, -2px)" }}>
							<MousePointer2
								size={20}
								style={{
									color: user.color,
									filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
								}}
								fill={user.color}
							/>
						</div>
					</foreignObject>

					{/* User name label */}
					<foreignObject
						x={25}
						y={-8}
						width="80"
						height="24"
						style={{ pointerEvents: "none" }}
					>
						<div
							style={{
								backgroundColor: user.color,
								color: new TinyColor(user.color).isLight() ? "black" : "white",
								fontSize: "12px",
								padding: "2px 6px",
								borderRadius: "4px",
								whiteSpace: "nowrap",
								fontFamily: "Ubuntu, sans-serif",
								fontWeight: "500",
								boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
							}}
						>
							{user.name}
						</div>
					</foreignObject>
				</g>
			))}
		</>
	);
};
