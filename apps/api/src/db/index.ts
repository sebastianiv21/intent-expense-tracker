import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./schema/auth";
import * as categorySchema from "./schema/category";
import * as transactionSchema from "./schema/transaction";
import * as budgetSchema from "./schema/budget";
import * as financialProfileSchema from "./schema/financial-profile";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({
  client: sql,
  schema: {
    ...authSchema,
    ...categorySchema,
    ...transactionSchema,
    ...budgetSchema,
    ...financialProfileSchema,
  },
});

