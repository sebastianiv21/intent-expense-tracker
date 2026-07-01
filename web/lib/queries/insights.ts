import { format } from "date-fns";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, financialProfile, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { BUCKET_DEFINITIONS } from "@/lib/finance-utils";
import type { AllocationBucket, FinancialProfile } from "@/types";

// Resolve a "yyyy-MM" month into an inclusive [startDate, endDate] range of
// "yyyy-MM-dd" strings for filtering the `date` column. Day 0 of the next
// month is the last day of the target month.
function monthRange(month: string) {
  const startDate = `${month}-01`;
  const [year, monthNum] = month.split("-").map(Number);
  const endDate = format(new Date(year, monthNum, 0), "yyyy-MM-dd");
  return { startDate, endDate };
}

export async function getInsights(params: { month: string }) {
  const { userId } = await getAuthenticatedUser();
  const { startDate, endDate } = monthRange(params.month);

  const totals = await db
    .select({
      totalExpenses: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      totalIncome: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    );

  const spendingByCategory = await db
    .select({
      name: categories.name,
      icon: categories.icon,
      bucket: categories.allocationBucket,
      value: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .groupBy(categories.name, categories.icon, categories.allocationBucket);

  return {
    totalExpenses: Number(totals[0]?.totalExpenses ?? 0),
    totalIncome: Number(totals[0]?.totalIncome ?? 0),
    balance:
      Number(totals[0]?.totalIncome ?? 0) -
      Number(totals[0]?.totalExpenses ?? 0),
    transactionCount: Number(totals[0]?.count ?? 0),
    spendingByCategory: spendingByCategory.map((row) => ({
      name: row.name ?? "Uncategorized",
      icon: row.icon ?? null,
      value: Number(row.value ?? 0),
      bucket: (row.bucket ?? "needs") as AllocationBucket,
    })),
  };
}

export async function getAllocationSummary(params: { month: string }) {
  const { userId } = await getAuthenticatedUser();
  const { startDate, endDate } = monthRange(params.month);

  const profileResult = await db
    .select()
    .from(financialProfile)
    .where(eq(financialProfile.userId, userId))
    .limit(1);

  const profile = profileResult[0] as FinancialProfile | undefined;
  const incomeTarget = profile ? Number(profile.monthlyIncomeTarget) : 0;

  const totals = await db
    .select({
      bucket: categories.allocationBucket,
      amount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .groupBy(categories.allocationBucket);

  const actual = {
    needs: 0,
    wants: 0,
    future: 0,
  };

  totals.forEach((row) => {
    if (!row.bucket) return;
    actual[row.bucket as AllocationBucket] = Number(row.amount ?? 0);
  });

  const targets = {
    needs:
      (incomeTarget *
        (profile
          ? Number(profile.needsPercentage)
          : BUCKET_DEFINITIONS.needs.defaultPercentage)) /
      100,
    wants:
      (incomeTarget *
        (profile
          ? Number(profile.wantsPercentage)
          : BUCKET_DEFINITIONS.wants.defaultPercentage)) /
      100,
    future:
      (incomeTarget *
        (profile
          ? Number(profile.futurePercentage)
          : BUCKET_DEFINITIONS.future.defaultPercentage)) /
      100,
  };

  return {
    income: incomeTarget,
    targets,
    actual,
  };
}
