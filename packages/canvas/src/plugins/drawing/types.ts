export interface Position {
	x: number;
	y: number;
}

export interface DrawPath {
	id: string;
	points: Position[];
	color: string;
	strokeWidth: number;
}

export interface DrawState {
	isDrawing: boolean;
	currentPath: Position[] | null;
	paths: DrawPath[];
}
