import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@jammwork/ui";
import { UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";

interface Member {
	id: string;
	name: string;
	color: string;
}

interface MemberListProps {
	awareness?: Awareness;
	currentUserId: string;
}

export const MemberList: React.FC<MemberListProps> = ({
	awareness,
	currentUserId,
}) => {
	const [members, setMembers] = useState<Member[]>([]);

	useEffect(() => {
		if (!awareness) return;

		const updateMembers = () => {
			const membersList: Member[] = [];

			awareness.getStates().forEach((state) => {
				if (state.user) {
					membersList.push({
						id: state.user.id,
						name: state.user.name,
						color: state.user.color,
					});
				}
			});

			setMembers(membersList);
		};

		// Initial update
		updateMembers();

		// Listen for awareness changes
		awareness.on("change", updateMembers);

		return () => {
			awareness.off("change", updateMembers);
		};
	}, [awareness]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="relative">
					<UsersIcon className="w-4 h-4" />
					<span className="text-xs">{members.length}</span>
					<span className="sr-only">Members</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				sideOffset={10}
				side="right"
				align="start"
				className="w-52"
			>
				<DropdownMenuLabel>Members</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{members.length === 0 ? (
					<DropdownMenuItem disabled>
						<span className="text-muted-foreground">No members online</span>
					</DropdownMenuItem>
				) : (
					members.map((member) => (
						<DropdownMenuItem
							key={member.id}
							className="flex items-center gap-2"
						>
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: member.color }}
							/>
							<span>{member.name}</span>
							{currentUserId === member.id && (
								<span className="text-xs text-muted-foreground ml-auto">
									You
								</span>
							)}
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
