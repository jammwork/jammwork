import type {
	CreateSpaceRequest,
	Space,
	UpdateSpaceRequest,
} from "../../types/space.js";
import { logger } from "../../utils/logger.js";
import type { DatabaseService } from "../database/index.js";

export class SpaceService {
	private dbService: DatabaseService;

	constructor(dbService: DatabaseService) {
		this.dbService = dbService;
	}

	async createSpace(request: CreateSpaceRequest): Promise<Space> {
		try {
			this.validateCreateSpaceRequest(request);

			const spaceData = {
				name: request.name,
				description: request.description,
				pluginIds: request.pluginIds,
				createdBy: request.createdBy,
				isActive: true,
			};

			const space = await this.dbService.createSpace(spaceData);
			logger.info("Space created via service", { spaceId: space.id });
			return space;
		} catch (error) {
			logger.error("Space service: Failed to create space", { error });
			throw error;
		}
	}

	async getSpace(id: string): Promise<Space | null> {
		try {
			const space = await this.dbService.getSpaceById(id);
			if (!space) {
				logger.warn("Space not found", { spaceId: id });
			}
			return space;
		} catch (error) {
			logger.error("Space service: Failed to get space", {
				error,
				spaceId: id,
			});
			throw error;
		}
	}

	async getAllSpaces(): Promise<Space[]> {
		try {
			return await this.dbService.getAllSpaces();
		} catch (error) {
			logger.error("Space service: Failed to get all spaces", { error });
			throw error;
		}
	}

	async getActiveSpaces(): Promise<Space[]> {
		try {
			return await this.dbService.getActiveSpaces();
		} catch (error) {
			logger.error("Space service: Failed to get active spaces", { error });
			throw error;
		}
	}

	async getSpacesByUserUuid(userUuid: string): Promise<Space[]> {
		try {
			return await this.dbService.getSpacesByUserUuid(userUuid);
		} catch (error) {
			logger.error("Space service: Failed to get spaces by user UUID", {
				error,
				userUuid,
			});
			throw error;
		}
	}

	async updateSpace(
		id: string,
		updates: UpdateSpaceRequest,
	): Promise<Space | null> {
		try {
			this.validateUpdateSpaceRequest(updates);

			const space = await this.dbService.updateSpace(id, updates);
			if (!space) {
				logger.warn("Space not found for update", { spaceId: id });
			}
			return space;
		} catch (error) {
			logger.error("Space service: Failed to update space", {
				error,
				spaceId: id,
			});
			throw error;
		}
	}

	async deleteSpace(id: string): Promise<boolean> {
		try {
			const deleted = await this.dbService.deleteSpace(id);
			if (!deleted) {
				logger.warn("Space not found for deletion", { spaceId: id });
			}
			return deleted;
		} catch (error) {
			logger.error("Space service: Failed to delete space", {
				error,
				spaceId: id,
			});
			throw error;
		}
	}

	async getSpacesByPlugin(pluginId: string): Promise<Space[]> {
		try {
			return await this.dbService.getSpacesByPluginId(pluginId);
		} catch (error) {
			logger.error("Space service: Failed to get spaces by plugin", {
				error,
				pluginId,
			});
			throw error;
		}
	}

	private validateCreateSpaceRequest(request: CreateSpaceRequest): void {
		if (!request.name || request.name.trim().length === 0) {
			throw new Error("Space name is required");
		}

		if (
			!request.pluginIds ||
			!Array.isArray(request.pluginIds) ||
			request.pluginIds.length === 0
		) {
			throw new Error("At least one plugin ID is required");
		}

		if (!request.createdBy || request.createdBy.trim().length === 0) {
			throw new Error("Created by field is required");
		}

		if (request.name.length > 100) {
			throw new Error("Space name must be less than 100 characters");
		}

		if (request.description && request.description.length > 500) {
			throw new Error("Space description must be less than 500 characters");
		}
	}

	private validateUpdateSpaceRequest(updates: UpdateSpaceRequest): void {
		if (
			updates.name !== undefined &&
			(updates.name.trim().length === 0 || updates.name.length > 100)
		) {
			throw new Error("Space name must be between 1 and 100 characters");
		}

		if (updates.description !== undefined && updates.description.length > 500) {
			throw new Error("Space description must be less than 500 characters");
		}

		if (
			updates.pluginIds !== undefined &&
			(!Array.isArray(updates.pluginIds) || updates.pluginIds.length === 0)
		) {
			throw new Error("Plugin IDs must be a non-empty array");
		}
	}
}
