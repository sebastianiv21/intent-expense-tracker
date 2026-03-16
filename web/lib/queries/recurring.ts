import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, recurringTransactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import type {
  Category,
  RecurringTransaction,
  RecurringTransactionWithCategory,
} from "@/types";

export async function getRecurringTransactions(): Promise<
  RecurringTransactionWithCategory[]
> {
  const { userId } = await getAuthenticatedUser();

  const result = await db
    .select({
      recurring: recurringTransactions,
      category: categories,
    })
    .from(recurringTransactions)
    .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
    .where(eq(recurringTransactions.userId, userId))
    .orderBy(desc(recurringTransactions.createdAt));

  return result.map(({ recurring, category }) => ({
    ...(recurring as RecurringTransaction),
    category: (category as Category) ?? null,
  }));
}
