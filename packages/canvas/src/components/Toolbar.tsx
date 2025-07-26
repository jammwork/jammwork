import { Button } from '@jammwork/ui';
import { HandIcon, PenIcon } from 'lucide-react';

function Toolbar() {
	return (
		<div className='fixed bottom-3 left-0 right-0 flex flex-col gap-1 justify-center items-center'>
			<div className='p-2 bg-secondary rounded-lg shadow-lg space-x-0.5 flex items-center'>
				<Button variant='ghost' size='icon'>
					<PenIcon />
				</Button>
				<Button >
					<HandIcon />
				</Button>
				{/* Divider */}
				{/* <div className='h-4 w-px bg-foreground/25 mx-2' /> */}
			</div>
		</div>
	);
}

export default Toolbar;