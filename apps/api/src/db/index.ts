import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as authSchema from "./schema/auth";
import * as categorySchema from "./schema/category";
import * as transactionSchema from "./schema/transaction";
import * as budgetSchema from "./schema/budget";
import * as financialProfileSchema from "./schema/financial-profile";

export const schema = {
  ...authSchema,
  ...categorySchema,
  ...transactionSchema,
  ...budgetSchema,
  ...financialProfileSchema,
};

export type FullSchema = typeof schema;
export type DbClient = NeonHttpDatabase<FullSchema>;

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(databaseUrl);
    _db = drizzle({
      client: sql,
      schema,
    });
  }
  return _db;
}
