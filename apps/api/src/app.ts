import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { sql } from 'drizzle-orm'

import { v1Routes } from "./routes/v1";
import { generalRateLimiter } from "./lib/middleware/rate-limiter";
import { getDb } from "./db";

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
app.use(generalRateLimiter);

// CORS configuration
app.use(
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL, // Production frontend URL
      ].filter(Boolean);

      // Allow exact matches
      if (allowedOrigins.includes(origin || "")) {
        return origin;
      }

      // Default to first allowed origin for requests without origin
      return allowedOrigins[0];
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
  }),
);

// Health check
app.get("/health", async (c) => {
  try {
    // Test DB connection
    const db = getDb();
    await db.execute(sql`SELECT 1`);

    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.GIT_SHA || "unknown",
      checks: {
        database: "ok"
      }
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.GIT_SHA || "unknown",
      checks: {
        database: "ok"
      }
    }, 503);
  }
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
