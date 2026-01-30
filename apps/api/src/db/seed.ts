import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { category } from "./schema/category";
import { DEFAULT_CATEGORIES } from "./seed-data";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("Seeding default categories...");

  // Note: This script is intended for local/dev use.
  // In a real scenario, you'd likely want to associate these with a specific user
  // or use them as a template.

  // For the purpose of this MVP, we might want a "system" user or just
  // provide a way to seed a specific user's categories.

  // The IMPLEMENTATION_PLAN says "Create default category set for new users"
  // and "Optionally: Auto-create default categories on user registration".

  // Let's just create a generic seed script for now that could be adapted.
  // Actually, the categories table REQUIRES a userId.

  console.log("Please provide a USER_ID to seed categories for that user.");
  const userId = process.env.USER_ID;

  if (!userId) {
    console.error("USER_ID environment variable is required.");
    process.exit(1);
  }

  const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
  }));

  await db.insert(category).values(categoriesToInsert);

  console.log(
    `Successfully seeded ${categoriesToInsert.length} categories for user ${userId}`,
  );
}

main()
  .catch((e) => {
    console.error("Seeding failed");
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
