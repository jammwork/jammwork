import type { CreateSpaceRequest, Space, UpdateSpaceRequest } from "./types";

const API_BASE_URL =
	import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
		...options,
	});

	const data: ApiResponse<T> = await response.json();

	if (!response.ok) {
		throw new ApiError(
			data.error || `HTTP ${response.status}`,
			response.status,
		);
	}

	if (!data.success) {
		throw new ApiError(data.error || "API request failed", response.status);
	}

	return data.data as T;
}

export const spaceApi = {
	async createSpace(
		request: Omit<CreateSpaceRequest, "createdBy">,
	): Promise<Space> {
		return apiRequest<Space>("/api/spaces", {
			method: "POST",
			body: JSON.stringify(request),
		});
	},

	async getAllSpaces(): Promise<Space[]> {
		return apiRequest<Space[]>("/api/spaces");
	},

	async getActiveSpaces(): Promise<Space[]> {
		return apiRequest<Space[]>("/api/spaces?active=true");
	},

	async getUserSpaces(): Promise<Space[]> {
		return apiRequest<Space[]>("/api/spaces");
	},

	async getSpaceById(id: string): Promise<Space> {
		return apiRequest<Space>(`/api/spaces/${id}`);
	},

	async updateSpace(id: string, updates: UpdateSpaceRequest): Promise<Space> {
		return apiRequest<Space>(`/api/spaces/${id}`, {
			method: "PUT",
			body: JSON.stringify(updates),
		});
	},

	async deleteSpace(id: string): Promise<void> {
		await apiRequest(`/api/spaces/${id}`, {
			method: "DELETE",
		});
	},

	async getSpacesByPlugin(pluginId: string): Promise<Space[]> {
		return apiRequest<Space[]>(
			`/api/spaces?pluginId=${encodeURIComponent(pluginId)}`,
		);
	},
};

export { ApiError };
