import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { v4 as uuidv4 } from "uuid";

const userRouter = new Hono();

userRouter.get("/userid", async (c) => {
	try {
		// Try to get existing userId from cookie
		let userId = getCookie(c, "userId");

		// If no userId exists, generate a new one
		if (!userId) {
			userId = uuidv4();

			// Set cookie with userId (expires in 1 year)
			setCookie(c, "userId", userId, {
				httpOnly: false, // Allow client-side access
				secure: false, // Set to true in production with HTTPS
				sameSite: "Lax",
				maxAge: 60 * 60 * 24 * 365, // 1 year
				path: "/",
			});
		}

		return c.json({ success: true, data: { userId } });
	} catch (error) {
		console.error("Error in /userid endpoint:", error);
		return c.json(
			{ success: false, error: "Failed to get or generate user ID" },
			500,
		);
	}
});

export { userRouter };
