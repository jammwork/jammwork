import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Input,
	Label,
} from "@jammwork/ui";
import type React from "react";
import { useState } from "react";

interface DurationInputDialogProps {
	open: boolean;
	onConfirm: (duration: number, title?: string) => void;
	onCancel: () => void;
}

export const DurationInputDialog: React.FC<DurationInputDialogProps> = ({
	open,
	onConfirm,
	onCancel,
}) => {
	const [minutes, setMinutes] = useState("5");
	const [seconds, setSeconds] = useState("0");
	const [title, setTitle] = useState("");

	const handleConfirm = () => {
		const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
		if (totalSeconds > 0) {
			onConfirm(totalSeconds, title || undefined);
			setMinutes("5");
			setSeconds("0");
			setTitle("");
		}
	};

	const handleCancel = () => {
		onCancel();
		setMinutes("5");
		setSeconds("0");
		setTitle("");
	};

	return (
		<AlertDialog open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Create Timer</AlertDialogTitle>
					<AlertDialogDescription>
						Set the duration for your countdown timer.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Title (optional)</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Timer title..."
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="minutes">Minutes</Label>
							<Input
								id="minutes"
								type="number"
								min="0"
								max="59"
								value={minutes}
								onChange={(e) => setMinutes(e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="seconds">Seconds</Label>
							<Input
								id="seconds"
								type="number"
								min="0"
								max="59"
								value={seconds}
								onChange={(e) => setSeconds(e.target.value)}
							/>
						</div>
					</div>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm}>
						Create Timer
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
