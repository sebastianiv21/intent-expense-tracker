import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { sql } from "drizzle-orm";

import { v1Routes } from "./routes/v1";
import { generalRateLimiter } from "./lib/middleware/rate-limiter";
import { getDb } from "./db";

const app = new Hono();

// CORS configuration
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL,
      ].filter(Boolean) as string[];

      // Return the origin if it's in the allowed list
      if (allowedOrigins.includes(origin)) {
        return origin;
      }

      // Default to first allowed origin for requests without origin or non-matching origins
      return allowedOrigins[0] || "*";
    },
    credentials: true,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "User-Agent",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
  }),
);

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
        database: "ok",
      },
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.GIT_SHA || "unknown",
        checks: {
          database: "error",
        },
      },
      503,
    );
  }
});

// Routes
app.route("/api/v1", v1Routes);

// Helper to add CORS headers to any response
const addCorsHeaders = (c: any, response: Response): Response => {
  const origin = c.req.header("origin") || "";
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  // Return the origin if it's allowed, otherwise return the first allowed origin
  // This ensures CORS headers match the requesting origin
  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0] || "*";

  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
  newHeaders.set("Access-Control-Allow-Credentials", "true");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

// Error handler
app.onError((err, c) => {
  let response: Response;

  if (err instanceof HTTPException) {
    response = err.getResponse();
  } else {
    console.error("Unhandled error:", err);
    response = c.json({ error: "Internal server error" }, 500);
  }

  return addCorsHeaders(c, response);
});

// Not found handler
app.notFound((c) => {
  return addCorsHeaders(c, c.json({ error: "Not found" }, 404));
});

export default app;
