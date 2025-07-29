import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { v4 as uuidv4 } from "uuid";
import type { SpaceService } from "../services/space/index.js";
import type {
	CreateSpaceRequest,
	Space,
	UpdateSpaceRequest,
} from "../types/space.js";
import { logger } from "../utils/logger.js";

export function createSpaceRouter(spaceService: SpaceService) {
	const router = new Hono();

	router.post("/", async (c) => {
		try {
			const body = (await c.req.json()) as Omit<
				CreateSpaceRequest,
				"createdBy"
			>;

			// Get or generate UUID from cookie
			let userUuid = getCookie(c, "jammwork_user_uuid");

			// Generate new UUID if not found
			if (!userUuid) {
				userUuid = uuidv4();
			}

			setCookie(c, "jammwork_user_uuid", userUuid, {
				httpOnly: true,
				secure: false,
				sameSite: "Lax",
				maxAge: 31536000,
				path: "/",
			});

			const requestWithUuid: CreateSpaceRequest = {
				...body,
				createdBy: userUuid,
			};

			const space = await spaceService.createSpace(requestWithUuid);

			return c.json(
				{
					success: true,
					data: space,
				},
				201,
			);
		} catch (error) {
			logger.error("Space creation failed", { error });

			if (error instanceof Error) {
				return c.json(
					{
						success: false,
						error: error.message,
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: "Internal server error",
				},
				500,
			);
		}
	});

	router.get("/", async (c) => {
		try {
			let userUuid = getCookie(c, "jammwork_user_uuid");

			let spaces: Space[];

			if (userUuid) {
				spaces = await spaceService.getSpacesByUserUuid(userUuid);
			} else {
				// Generate new UUID and set cookie
				userUuid = uuidv4();
				setCookie(c, "jammwork_user_uuid", userUuid, {
					httpOnly: true,
					secure: false,
					sameSite: "Lax",
					maxAge: 31536000,
					path: "/",
				});

				// Return empty array for new users
				spaces = [];
			}

			return c.json({
				success: true,
				data: spaces,
			});
		} catch (error) {
			logger.error("Failed to get spaces", { error });

			return c.json(
				{
					success: false,
					error: "Failed to retrieve spaces",
				},
				500,
			);
		}
	});

	router.get("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const space = await spaceService.getSpace(id);

			if (!space) {
				return c.json(
					{
						success: false,
						error: "Space not found",
					},
					404,
				);
			}

			return c.json({
				success: true,
				data: space,
			});
		} catch (error) {
			logger.error("Failed to get space", {
				error,
				spaceId: c.req.param("id"),
			});

			return c.json(
				{
					success: false,
					error: "Failed to retrieve space",
				},
				500,
			);
		}
	});

	router.put("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const body = (await c.req.json()) as UpdateSpaceRequest;

			const space = await spaceService.updateSpace(id, body);

			if (!space) {
				return c.json(
					{
						success: false,
						error: "Space not found",
					},
					404,
				);
			}

			return c.json({
				success: true,
				data: space,
			});
		} catch (error) {
			logger.error("Space update failed", {
				error,
				spaceId: c.req.param("id"),
			});

			if (error instanceof Error) {
				return c.json(
					{
						success: false,
						error: error.message,
					},
					400,
				);
			}

			return c.json(
				{
					success: false,
					error: "Internal server error",
				},
				500,
			);
		}
	});

	router.delete("/:id", async (c) => {
		try {
			const id = c.req.param("id");
			const deleted = await spaceService.deleteSpace(id);

			if (!deleted) {
				return c.json(
					{
						success: false,
						error: "Space not found",
					},
					404,
				);
			}

			return c.json({
				success: true,
				message: "Space deleted successfully",
			});
		} catch (error) {
			logger.error("Space deletion failed", {
				error,
				spaceId: c.req.param("id"),
			});

			return c.json(
				{
					success: false,
					error: "Failed to delete space",
				},
				500,
			);
		}
	});

	return router;
}
