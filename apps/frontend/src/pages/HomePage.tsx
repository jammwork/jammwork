import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
} from "@jammwork/ui";
import { Heart } from "lucide-react";
import { nanoid } from "nanoid";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
	const navigate = useNavigate();
	const nameRef = useRef<HTMLInputElement>(null);

	const defaultName = localStorage.getItem("name");

	function handleSubmit() {
		const roomId = nanoid();
		const name = nameRef.current?.value;

		if (!name || name.trim() === "") {
			alert("Please enter your name");
			return;
		}

		localStorage.setItem("name", name);

		navigate(`/room/${roomId}`);
	}

	return (
		<div className="h-screen w-screen flex flex-col gap-6 items-center justify-center">
			<Card className="w-96">
				<CardHeader>
					<img
						src="/jammwork.png"
						alt="Jammwork"
						className="w-14 h-14"
						draggable={false}
					/>
					<div className="h-4" />
					<CardTitle>Create a new room</CardTitle>
					<CardDescription>
						You can invite others to join after creating a room.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						defaultValue={defaultName ?? ""}
						type="text"
						placeholder="Your name"
						ref={nameRef}
					/>
				</CardContent>
				<CardFooter>
					<Button onClick={handleSubmit}>Submit</Button>
				</CardFooter>
			</Card>

			<p className="text-sm text-muted-foreground">
				Made with <Heart className="inline-block w-4 h-4" /> by{" "}
				<a href="https://github.com/jammwork" className="underline">
					Jammwork
				</a>
			</p>
		</div>
	);
}

export default HomePage;
