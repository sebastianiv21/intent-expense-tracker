import { DEFAULT_CATEGORIES } from "../db/seed-data";
import { category } from "../db/schema/category";
import { DbClient } from "../db";

export async function seedDefaultCategoriesForUser(
  db: DbClient,
  userId: string,
) {
  const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
  }));

  return await db.insert(category).values(categoriesToInsert);
}
