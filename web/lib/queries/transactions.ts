import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import type { Category, Transaction, TransactionType, TransactionWithCategory } from "@/types";

type OrderBy = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export async function getTransactions(params: {
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: OrderBy;
}): Promise<TransactionWithCategory[]> {
  const { userId } = await getAuthenticatedUser();
  const {
    type,
    categoryId,
    search,
    limit = 50,
    offset = 0,
    orderBy = "date_desc",
  } = params;

  const conditions = [eq(transactions.userId, userId)];

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  if (categoryId) {
    conditions.push(eq(transactions.categoryId, categoryId));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    const searchCondition = sql`${transactions.description} ILIKE ${term} OR ${categories.name} ILIKE ${term}`;
    conditions.push(searchCondition);
  }

  const orderByClause =
    orderBy === "date_asc"
      ? asc(transactions.date)
      : orderBy === "amount_asc"
        ? asc(transactions.amount)
        : orderBy === "amount_desc"
          ? desc(transactions.amount)
          : desc(transactions.date);

  const result = await db
    .select({
      transaction: transactions,
      category: categories,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return result.map(({ transaction, category }) => ({
    ...(transaction as Transaction),
    category: (category as Category) ?? null,
  }));
}
