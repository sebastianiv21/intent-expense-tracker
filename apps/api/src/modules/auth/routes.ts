import { Hono } from "hono";
import { getAuth } from "../../lib/auth";

export const authRoutes = new Hono();

// Better Auth handler
authRoutes.on(["POST", "GET"], "/*", async (c) => {
  const auth = getAuth();
  const res = await auth.handler(c.req.raw);
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});
