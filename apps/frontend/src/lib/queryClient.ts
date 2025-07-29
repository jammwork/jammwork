import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes
			retry: (failureCount, error) => {
				// Don't retry on 4xx errors
				if (error instanceof Error && "status" in error) {
					const status = (error as any).status;
					if (status >= 400 && status < 500) {
						return false;
					}
				}
				return failureCount < 3;
			},
		},
		mutations: {
			retry: false,
		},
	},
});
