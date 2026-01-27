import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth";

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  
  if (!session) {
    throw new HTTPException(401, { message: "Not authenticated" });
  }
  
  c.set("session", {
    user: {
      ...session.user,
      image: session.user.image || null,
    },
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    },
  });
  await next();
});
