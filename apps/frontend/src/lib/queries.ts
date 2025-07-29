import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Query keys
export const queryKeys = {
	spaces: ["spaces"] as const,
	space: (id: string) => ["spaces", id] as const,
	spacesByPlugin: (pluginId: string) =>
		["spaces", "by-plugin", pluginId] as const,
	userId: ["userId"] as const,
};

// User ID query
export const useUserId = () => {
	return useQuery({
		queryKey: queryKeys.userId,
		queryFn: async () => {
			const response = await apiRequest<{ userId: string }>("/api/userid");
			return response.userId;
		},
		staleTime: Infinity, // User ID shouldn't change during session
		gcTime: Infinity,
	});
};

// Space queries
export const useSpaces = () => {
	return useQuery({
		queryKey: queryKeys.spaces,
		queryFn: () => apiRequest<Space[]>("/api/spaces"),
	});
};

export const useActiveSpaces = () => {
	return useQuery({
		queryKey: [...queryKeys.spaces, "active"],
		queryFn: () => apiRequest<Space[]>("/api/spaces?active=true"),
	});
};

export const useSpace = (id: string) => {
	return useQuery({
		queryKey: queryKeys.space(id),
		queryFn: () => apiRequest<Space>(`/api/spaces/${id}`),
		enabled: !!id,
	});
};

export const useSpacesByPlugin = (pluginId: string) => {
	return useQuery({
		queryKey: queryKeys.spacesByPlugin(pluginId),
		queryFn: () =>
			apiRequest<Space[]>(
				`/api/spaces?pluginId=${encodeURIComponent(pluginId)}`,
			),
		enabled: !!pluginId,
	});
};

// Space mutations
export const useCreateSpace = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: Omit<CreateSpaceRequest, "createdBy">) =>
			apiRequest<Space>("/api/spaces", {
				method: "POST",
				body: JSON.stringify(request),
			}),
		onSuccess: () => {
			// Invalidate and refetch spaces list
			queryClient.invalidateQueries({ queryKey: queryKeys.spaces });
		},
	});
};

export const useUpdateSpace = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			updates,
		}: {
			id: string;
			updates: UpdateSpaceRequest;
		}) =>
			apiRequest<Space>(`/api/spaces/${id}`, {
				method: "PUT",
				body: JSON.stringify(updates),
			}),
		onSuccess: (updatedSpace) => {
			// Update the space in cache
			queryClient.setQueryData(queryKeys.space(updatedSpace.id), updatedSpace);
			// Invalidate spaces list to reflect changes
			queryClient.invalidateQueries({ queryKey: queryKeys.spaces });
		},
	});
};

export const useDeleteSpace = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			apiRequest(`/api/spaces/${id}`, {
				method: "DELETE",
			}),
		onSuccess: (_, deletedId) => {
			// Remove the space from cache
			queryClient.removeQueries({ queryKey: queryKeys.space(deletedId) });
			// Invalidate spaces list
			queryClient.invalidateQueries({ queryKey: queryKeys.spaces });
		},
	});
};

export { ApiError };
