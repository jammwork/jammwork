import {
	Button,
} from "@jammwork/ui";
import { PlusIcon, Settings2 } from "lucide-react";
import CreateSpaceDialog from "@/components/CreateSpaceDialog";
import SettingsDialog from '@/components/ProfileSettings';
import SpaceList from '@/components/SpaceList';

function HomePage() {
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
					<CreateSpaceDialog>
						<Button variant='outline'><PlusIcon /></Button>
					</CreateSpaceDialog>
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
