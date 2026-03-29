import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import type {
  Category,
  Transaction,
  TransactionTotals,
  TransactionType,
  TransactionWithCategory,
} from "@/types";

type OrderBy = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

function escapeILike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

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
    const term = `%${escapeILike(search.trim())}%`;
    const searchCondition = sql`(${transactions.description} ILIKE ${term} OR ${categories.name} ILIKE ${term})`;
    conditions.push(searchCondition);
  }

  const orderByClause =
    orderBy === "date_asc"
      ? [asc(transactions.date), asc(transactions.createdAt)]
      : orderBy === "amount_asc"
        ? [asc(transactions.amount), desc(transactions.createdAt)]
        : orderBy === "amount_desc"
          ? [desc(transactions.amount), desc(transactions.createdAt)]
          : [desc(transactions.date), desc(transactions.createdAt)];

  const result = await db
    .select({
      transaction: transactions,
      category: categories,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  return result.map(({ transaction, category }) => ({
    ...(transaction as Transaction),
    category: (category as Category) ?? null,
  }));
}

export async function getTransactionTotals(params: {
  type?: TransactionType;
  categoryId?: string;
  search?: string;
}): Promise<TransactionTotals> {
  const { userId } = await getAuthenticatedUser();
  const { type, categoryId, search } = params;

  const conditions = [eq(transactions.userId, userId)];

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  if (categoryId) {
    conditions.push(eq(transactions.categoryId, categoryId));
  }

  if (search && search.trim().length > 0) {
    const term = `%${escapeILike(search.trim())}%`;
    const searchCondition = sql`(${transactions.description} ILIKE ${term} OR ${categories.name} ILIKE ${term})`;
    conditions.push(searchCondition);
  }

  const result = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions));

  return {
    count: result[0]?.count ?? 0,
    totalIncome: Number(result[0]?.totalIncome ?? 0),
    totalExpenses: Number(result[0]?.totalExpenses ?? 0),
  };
}
