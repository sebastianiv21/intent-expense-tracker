import { rateLimiter } from "hono-rate-limiter";
import type { Env } from "../../types/cloudflare";
import type { Context } from "hono";

// Key generator using Cloudflare's connecting IP
const ipKeyGenerator = (c: Context) => c.req.header("cf-connecting-ip") ?? "";

// General API rate limiter (100req/min)
export const generalRateLimiter = rateLimiter<{ Bindings: Env }>({
  binding: (c) => c.env.GENERAL_RATE_LIMITER,
  keyGenerator: ipKeyGenerator,
  skip: (c) => c.req.path === "/health",
  message: {
    message: "Rate limit exceeded",
    retryAfter: "60s",
  },
});

// Auth-specific rate limiter (5req/min) - stricter for brute force protection
export const authRateLimiter = rateLimiter<{ Bindings: Env }>({
  binding: (c) => c.env.AUTH_RATE_LIMITER,
  keyGenerator: ipKeyGenerator,
  message: {
    message: "Too many login attempts",
    retryAfter: "60s",
  },
});
