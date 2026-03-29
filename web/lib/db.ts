import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Enable WebSocket support for environments that don't have native WebSockets
// (e.g. Node.js). In edge runtimes like Cloudflare Workers, this is not needed.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
