import { Hono } from "hono";
import { getAuth } from "../../lib/auth";

export const authRoutes = new Hono();

// Better Auth handler - return directly to preserve CORS headers
authRoutes.on(["POST", "GET"], "/*", (c) => {
  const auth = getAuth();
  return auth.handler(c.req.raw);
});
