import { format } from "date-fns";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  financialProfile,
  recurringTransactions,
  transactions,
} from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import {
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
  calculateBucketTarget,
  calculatePercentage,
} from "@/lib/finance-utils";
import type {
  AllocationBucket,
  Category,
  FinancialProfile,
  RecurringTransaction,
  RecurringTransactionWithCategory,
  Transaction,
  TransactionWithCategory,
} from "@/types";

type BucketSummary = {
  bucket: AllocationBucket;
  label: string;
  color: string;
  spent: number;
  target: number;
  progress: number;
  percentage: number;
};

type DashboardData = {
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  bucketSummaries: BucketSummary[];
  recentTransactions: TransactionWithCategory[];
  upcomingRecurring: RecurringTransactionWithCategory[];
  quickStats: {
    dailyAverage: number;
    safeToSpend: number;
    daysRemaining: number;
  };
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const { userId } = await getAuthenticatedUser();
  const now = new Date();
  const startOfMonth = format(
    new Date(now.getFullYear(), now.getMonth(), 1),
    "yyyy-MM-dd",
  );
  const endOfMonth = format(
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
    "yyyy-MM-dd",
  );

  // Run all independent queries in parallel for better performance
  const [profileResult, totalsResult, bucketRows, recentRows, recurringRows] =
    await Promise.all([
      db
        .select()
        .from(financialProfile)
        .where(eq(financialProfile.userId, userId))
        .limit(1),

      db
        .select({
          income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
          expenses: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth),
            lte(transactions.date, endOfMonth),
          ),
        ),

      db
        .select({
          bucket: categories.allocationBucket,
          spent: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startOfMonth),
            lte(transactions.date, endOfMonth),
          ),
        )
        .groupBy(categories.allocationBucket),

      db
        .select({
          transaction: transactions,
          category: categories,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(5),

      // Include both upcoming and overdue recurring transactions
      db
        .select({
          recurring: recurringTransactions,
          category: categories,
        })
        .from(recurringTransactions)
        .leftJoin(
          categories,
          eq(recurringTransactions.categoryId, categories.id),
        )
        .where(
          and(
            eq(recurringTransactions.userId, userId),
            eq(recurringTransactions.isActive, true),
          ),
        )
        .orderBy(asc(recurringTransactions.nextDueDate))
        .limit(3),
    ]);

  const profile = profileResult[0] as FinancialProfile | undefined;

  const monthIncome = toNumber(totalsResult[0]?.income);
  const monthExpenses = toNumber(totalsResult[0]?.expenses);
  const balance = monthIncome - monthExpenses;

  const monthlyIncomeTarget = profile
    ? toNumber(profile.monthlyIncomeTarget)
    : 0;
  const needsPercentage = profile
    ? toNumber(profile.needsPercentage)
    : BUCKET_DEFINITIONS.needs.defaultPercentage;
  const wantsPercentage = profile
    ? toNumber(profile.wantsPercentage)
    : BUCKET_DEFINITIONS.wants.defaultPercentage;
  const futurePercentage = profile
    ? toNumber(profile.futurePercentage)
    : BUCKET_DEFINITIONS.future.defaultPercentage;

  const bucketTotals = new Map<AllocationBucket, number>(
    BUCKET_ORDER.map((bucket) => [bucket, 0]),
  );

  bucketRows.forEach((row) => {
    const bucket = row.bucket as AllocationBucket | null;
    if (!bucket || !bucketTotals.has(bucket)) return;
    bucketTotals.set(bucket, toNumber(row.spent));
  });

  const bucketSummaries: BucketSummary[] = BUCKET_ORDER.map((bucket) => {
    const spent = bucketTotals.get(bucket) ?? 0;
    const percentage =
      bucket === "needs"
        ? needsPercentage
        : bucket === "wants"
          ? wantsPercentage
          : futurePercentage;
    const target = calculateBucketTarget(monthlyIncomeTarget, percentage);

    return {
      bucket,
      label: BUCKET_DEFINITIONS[bucket].label,
      color: BUCKET_DEFINITIONS[bucket].color,
      spent,
      target,
      progress: calculatePercentage(spent, target),
      percentage,
    };
  });

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0);
  const dailyAverage = dayOfMonth > 0 ? monthExpenses / dayOfMonth : 0;
  const safeToSpend = Math.max(monthlyIncomeTarget - monthExpenses, 0);

  return {
    balance,
    monthIncome,
    monthExpenses,
    bucketSummaries,
    recentTransactions: recentRows.map(({ transaction, category }) => ({
      ...(transaction as Transaction),
      category: (category as Category) ?? null,
    })),
    upcomingRecurring: recurringRows.map(({ recurring, category }) => ({
      ...(recurring as RecurringTransaction),
      category: (category as Category) ?? null,
    })),
    quickStats: {
      dailyAverage,
      safeToSpend,
      daysRemaining,
    },
  };
}
