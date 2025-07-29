import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import type { Space } from "../../types/space.js";
import { logger } from "../../utils/logger.js";

interface DatabaseSchema {
	spaces: Space[];
}

export class DatabaseService {
	private db: Low<DatabaseSchema>;
	private readonly dbPath: string;

	constructor(dbPath: string = "./data/db.json") {
		this.dbPath = dbPath;
		this.db = new Low(new JSONFile<DatabaseSchema>(this.dbPath), {
			spaces: [],
		});
	}

	async initialize(): Promise<void> {
		try {
			await this.db.read();
			if (!this.db.data) {
				this.db.data = { spaces: [] };
				await this.db.write();
			}
			logger.info("Database initialized successfully");
		} catch (error) {
			logger.error("Failed to initialize database", { error });
			throw new Error("Database initialization failed");
		}
	}

	async createSpace(
		space: Omit<Space, "id" | "createdAt" | "updatedAt">,
	): Promise<Space> {
		try {
			await this.db.read();

			const newSpace: Space = {
				...space,
				id: this.generateSpaceId(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			this.db.data.spaces.push(newSpace);
			await this.db.write();

			logger.info("Space created successfully", { spaceId: newSpace.id });
			return newSpace;
		} catch (error) {
			logger.error("Failed to create space", { error });
			throw new Error("Failed to create space");
		}
	}

	async getSpaceById(id: string): Promise<Space | null> {
		try {
			await this.db.read();
			const space = this.db.data.spaces.find((s) => s.id === id);
			return space || null;
		} catch (error) {
			logger.error("Failed to get space by ID", { error, spaceId: id });
			throw new Error("Failed to retrieve space");
		}
	}

	async getAllSpaces(): Promise<Space[]> {
		try {
			await this.db.read();
			return this.db.data.spaces.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		} catch (error) {
			logger.error("Failed to get all spaces", { error });
			throw new Error("Failed to retrieve spaces");
		}
	}

	async getActiveSpaces(): Promise<Space[]> {
		try {
			await this.db.read();
			return this.db.data.spaces
				.filter((space) => space.isActive)
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
		} catch (error) {
			logger.error("Failed to get active spaces", { error });
			throw new Error("Failed to retrieve active spaces");
		}
	}

	async getSpacesByUserUuid(userUuid: string): Promise<Space[]> {
		try {
			await this.db.read();
			return this.db.data.spaces
				.filter((space) => space.createdBy === userUuid)
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
		} catch (error) {
			logger.error("Failed to get spaces by user UUID", { error, userUuid });
			throw new Error("Failed to retrieve spaces by user");
		}
	}

	async updateSpace(
		id: string,
		updates: Partial<Space>,
	): Promise<Space | null> {
		try {
			await this.db.read();
			const spaceIndex = this.db.data.spaces.findIndex((s) => s.id === id);

			if (spaceIndex === -1) {
				return null;
			}

			const updatedSpace: Space = {
				...this.db.data.spaces[spaceIndex],
				...updates,
				updatedAt: new Date().toISOString(),
			};

			this.db.data.spaces[spaceIndex] = updatedSpace;
			await this.db.write();

			logger.info("Space updated successfully", { spaceId: id });
			return updatedSpace;
		} catch (error) {
			logger.error("Failed to update space", { error, spaceId: id });
			throw new Error("Failed to update space");
		}
	}

	async deleteSpace(id: string): Promise<boolean> {
		try {
			await this.db.read();
			const spaceIndex = this.db.data.spaces.findIndex((s) => s.id === id);

			if (spaceIndex === -1) {
				return false;
			}

			this.db.data.spaces.splice(spaceIndex, 1);
			await this.db.write();

			logger.info("Space deleted successfully", { spaceId: id });
			return true;
		} catch (error) {
			logger.error("Failed to delete space", { error, spaceId: id });
			throw new Error("Failed to delete space");
		}
	}

	async getSpacesByPluginId(pluginId: string): Promise<Space[]> {
		try {
			await this.db.read();
			return this.db.data.spaces
				.filter((space) => space.pluginIds.includes(pluginId) && space.isActive)
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
		} catch (error) {
			logger.error("Failed to get spaces by plugin ID", { error, pluginId });
			throw new Error("Failed to retrieve spaces by plugin");
		}
	}

	private generateSpaceId(): string {
		return nanoid();
	}

	async close(): Promise<void> {
		try {
			await this.db.write();
			logger.info("Database connection closed");
		} catch (error) {
			logger.error("Error closing database", { error });
		}
	}
}
