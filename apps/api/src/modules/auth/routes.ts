import { Hono } from "hono";
import { auth } from "../../lib/auth";

export const authRoutes = new Hono();

// Better Auth handler
authRoutes.on(["POST", "GET"], "/*", async (c) => {
  const res = await auth.handler(c.req.raw);
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});
