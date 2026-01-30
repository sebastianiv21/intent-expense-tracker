import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";

import { v1Routes } from "./routes/v1";

const app = new Hono();

// Middleware
app.use(requestId());
app.use(
  pinoLogger({
    pino: {
      level: "info",
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL, // Production frontend URL
      ].filter(Boolean);

      return allowedOrigins.includes(origin || "") ? origin : allowedOrigins[0];
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Routes
app.route("/api/v1", v1Routes);

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error("Unhandled error:", err);

  return c.json({ error: "Internal server error" }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

export default app;
