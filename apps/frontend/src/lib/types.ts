export interface Space {
	id: string;
	name: string;
	description?: string;
	pluginIds: string[];
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	isActive: boolean;
}

export interface CreateSpaceRequest {
	name: string;
	description?: string;
	pluginIds: string[];
	createdBy: string;
}

export interface UpdateSpaceRequest {
	name?: string;
	description?: string;
	pluginIds?: string[];
	isActive?: boolean;
}

export interface SpaceResponse {
	success: boolean;
	data?: Space;
	error?: string;
}

export interface SpacesResponse {
	success: boolean;
	data?: Space[];
	error?: string;
}
