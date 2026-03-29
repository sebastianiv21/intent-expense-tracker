import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { budgets, categories, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import type { BudgetWithCategory, BudgetWithSpending, Category } from "@/types";

export async function getBudgets(): Promise<BudgetWithCategory[]> {
  const { userId } = await getAuthenticatedUser();

  const result = await db
    .select({
      budget: budgets,
      category: categories,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.userId, userId))
    .orderBy(asc(categories.name));

  return result.map(({ budget, category }) => ({
    ...budget,
    category: category as Category,
  })) as BudgetWithCategory[];
}

export async function getBudgetsWithSpending(params: {
  month: string;
}): Promise<BudgetWithSpending[]> {
  const { userId } = await getAuthenticatedUser();
  const startDate = `${params.month}-01`;
  const [year, month] = params.month.split("-").map(Number);
  const endDate = format(new Date(year, month, 0), "yyyy-MM-dd");

  const result = await db
    .select({
      budget: budgets,
      category: categories,
      spent: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, categories.id),
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .where(eq(budgets.userId, userId))
    .groupBy(budgets.id, categories.id)
    .orderBy(asc(categories.name));

  return result.map(({ budget, category, spent }) => ({
    ...budget,
    category: category as Category,
    spent: Number(spent),
  })) as BudgetWithSpending[];
}
