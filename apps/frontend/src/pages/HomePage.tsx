import {
	Button,
} from "@jammwork/ui";
import { PlusIcon, Settings2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingsDialog from '@/components/ProfileSettings';
import SpaceList from '@/components/SpaceList';
import { getRandomPastelColor } from "@/lib/colors";

function HomePage() {
	const navigate = useNavigate();
	const nameRef = useRef<HTMLInputElement>(null);

	const defaultName = localStorage.getItem("name");
	const defaultColor = localStorage.getItem("color") ?? getRandomPastelColor();

	const [selectedColor, setSelectedColor] = useState(defaultColor);

	useEffect(() => {
		localStorage.setItem("color", selectedColor);
	}, [selectedColor]);

	function handleSubmit() {
		const spaceId = nanoid();
		const name = nameRef.current?.value;

		if (!name || name.trim() === "") {
			alert("Please enter your name");
			return;
		}

		localStorage.setItem("name", name);

		navigate(`/space/${spaceId}`);
	}

	return (
		<div className="h-screen w-screen">
			<div className="max-w-xl mx-auto pt-20 flex items-center gap-4">
				<img src="/jammwork.png" alt="Jammwork" className="w-12 h-12" draggable={false} />
				<div>
					<h1 className="text-xl font-bold">Jammwork</h1>
					<p className="text-sm text-muted-foreground">
						Collaborate with your team in real-time.
					</p>
				</div>
				<div className='ml-auto space-x-2'>
					<Button variant='outline'><PlusIcon /></Button>
					<SettingsDialog>
						<Button variant='outline'><Settings2 /></Button>
					</SettingsDialog>
				</div>
			</div>

			<div className="max-w-xl mx-auto pt-10 space-y-6">
				<SpaceList />
			</div>
		</div>
	);
}

export default HomePage;
