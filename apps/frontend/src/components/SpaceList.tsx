import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jammwork/ui';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, spaceApi } from '@/lib/api';
import type { Space } from '@/lib/types';

function SpaceList() {
	const navigate = useNavigate();
	const [spaces, setSpaces] = useState<Space[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deletingSpaceId, setDeletingSpaceId] = useState<string | null>(null);

	useEffect(() => {
		loadSpaces();
	}, []);

	const loadSpaces = async () => {
		try {
			setLoading(true);
			setError(null);
			const userSpaces = await spaceApi.getUserSpaces();
			setSpaces(userSpaces);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(`Failed to load spaces: ${err.message}`);
			} else {
				setError('Failed to load spaces');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleSpaceClick = (spaceId: string) => {
		navigate(`/space/${spaceId}`);
	};

	const handleDeleteSpace = async (spaceId: string, spaceName: string) => {
		if (!confirm(`Are you sure you want to delete "${spaceName}"? This action cannot be undone.`)) {
			return;
		}

		try {
			setDeletingSpaceId(spaceId);
			await spaceApi.deleteSpace(spaceId);
			setSpaces(spaces.filter(space => space.id !== spaceId));
		} catch (err) {
			if (err instanceof ApiError) {
				alert(`Failed to delete space: ${err.message}`);
			} else {
				alert('Failed to delete space');
			}
		} finally {
			setDeletingSpaceId(null);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Your Spaces</h2>
				<div className="space-y-2">
					<div className="h-20 bg-muted animate-pulse rounded-lg" />
					<div className="h-20 bg-muted animate-pulse rounded-lg" />
					<div className="h-20 bg-muted animate-pulse rounded-lg" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Your Spaces</h2>
				<div className="text-sm text-destructive">
					{error}
					<Button
						variant="link"
						onClick={loadSpaces}
						className="p-0 h-auto ml-2"
					>
						Try again
					</Button>
				</div>
			</div>
		);
	}

	if (spaces.length === 0) {
		return (
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Your Spaces</h2>
				<p className="text-sm text-muted-foreground">
					No spaces yet. Create your first space to get started.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Your Spaces</h2>
			<div className="space-y-3">
				{spaces.map((space) => (
					<Card
						key={space.id}
						className="hover:bg-muted/50 transition-colors"
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-2">
								<button
									type="button"
									className="flex-1 text-left cursor-pointer bg-transparent border-none p-0"
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleSpaceClick(space.id);
										}
									}}
									aria-label={`Open space "${space.name}"`}
								>
									<CardTitle className="text-base">{space.name}</CardTitle>
									{space.description && (
										<CardDescription className="text-sm">
											{space.description || 'No description'}
										</CardDescription>
									)}
								</button>
								<Button
									variant="outline"
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteSpace(space.id, space.name);
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.stopPropagation();
											handleDeleteSpace(space.id, space.name);
										}
									}}
									disabled={deletingSpaceId === space.id}
									className="ml-2"
									aria-label={`Delete space "${space.name}"`}
								>
									{deletingSpaceId === space.id ? 'Deleting...' : 'Delete'}
								</Button>
								<Link to={`/space/${space.id}`}>
									<Button
										variant="outline"
										size="sm"
									>
										Open
									</Button>
								</Link>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>Created {formatDate(space.createdAt)}</span>
								<span>{space.pluginIds.length} plugin{space.pluginIds.length !== 1 ? 's' : ''}</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export default SpaceList;