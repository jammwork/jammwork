type Space = {
	id: string;
	name: string;
	createdAt: string;
}

function getSpaces(): Space[] {
	const spaces = localStorage.getItem('spaces') ?? '[]';
	return JSON.parse(spaces);
}

function SpaceList() {
	const spaces = getSpaces();

	if (spaces.length === 0) {
		return <p className='text-sm uppercase text-muted-foreground'>No recent spaces</p>
	}

	return (
		<div className='space-y-2'>
			<div className='flex flex-col gap-2'>
				<div className='flex items-center gap-2'>
					<div className='w-10 h-10 rounded-full bg-muted-foreground'></div>
					<p className='text-sm'>Space 1</p>
				</div>
			</div>
		</div>
	);
}

export default SpaceList;