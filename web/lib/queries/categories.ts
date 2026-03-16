import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import type { Category, TransactionType } from "@/types";

export async function getCategories(params?: {
  type?: TransactionType;
}): Promise<Category[]> {
  const { userId } = await getAuthenticatedUser();
  const type = params?.type;

  if (!type) {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name));

    return result as Category[];
  }

  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, type)))
    .orderBy(asc(categories.name));

  return result as Category[];
}
