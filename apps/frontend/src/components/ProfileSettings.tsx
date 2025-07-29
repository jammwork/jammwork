import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label, toast } from '@jammwork/ui';
import { useState } from 'react';
import { getRandomPastelColor, pastelColors } from '@/lib/colors';

type SettingsDialogProps = {
	children: React.ReactNode;
}

function SettingsDialog({ children }: SettingsDialogProps) {
	const [name, setName] = useState(localStorage.getItem('name') ?? '');
	const [color, setColor] = useState(localStorage.getItem('color') ?? getRandomPastelColor());

	function saveSettings() {
		localStorage.setItem('name', name);
		localStorage.setItem('color', color);

		toast.success("Settings saved!")
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Manage your profile and preferences.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<div className='flex justify-between items-center gap-2'>
						<Label>Name</Label>
						<Input className='w-52' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className='flex justify-between items-center gap-2'>
						<Label>Color</Label>
						<div className='flex items-center gap-2'>
							{pastelColors.map((clr) => (
								<button type='button' key={clr} className='w-8 h-8 rounded-md transition-all duration-300' style={{
									opacity: clr === color ? 1 : 0.5,
									backgroundColor: clr
								}} onClick={() => setColor(clr)} />
							))}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant={'outline'} onClick={() => {
						saveSettings();
					}}>Submit</Button>
					<Button variant={'ghost'}>Cancel</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default SettingsDialog;