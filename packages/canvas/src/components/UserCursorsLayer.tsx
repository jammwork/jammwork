import React from "react";
import { UserCursors } from "./UserCursors";
import type { Awareness } from "y-protocols/awareness";

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
