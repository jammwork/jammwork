import type React from "react";
import type { Awareness } from "y-protocols/awareness";
import { UserCursors } from "./UserCursors";

interface UserCursorsLayerProps {
	awareness?: Awareness;
	currentUserId: string;
}

export const UserCursorsLayer: React.FC<UserCursorsLayerProps> = ({
	awareness,
	currentUserId,
}) => {
	return <UserCursors awareness={awareness} currentUserId={currentUserId} />;
};
