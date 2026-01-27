import type { Env } from "./types/cloudflare";
import app from "./app";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Set environment variables globally for database access
    Object.assign(process.env, env);

    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
