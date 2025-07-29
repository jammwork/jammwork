export const serverConfig = {
	http: {
		port: process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000,
		host: process.env.HTTP_HOST || "localhost",
	},
	websocket: {
		port: process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 1234,
		host: process.env.WS_HOST || "localhost",
	},
	yjs: {
		enablePersistence: process.env.YJS_PERSISTENCE === "true",
		persistencePath: process.env.YJS_PERSISTENCE_PATH || "./yjs-docs",
		maxSpaces: process.env.YJS_MAX_SPACES
			? parseInt(process.env.YJS_MAX_SPACES)
			: 1000,
	},
	cors: {
		origins: process.env.CORS_ORIGINS?.split(",") || [
			"http://localhost:4200",
			"http://localhost:3000",
		],
		credentials: true,
	},
	logging: {
		level:
			(process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "debug",
	},
} as const;
