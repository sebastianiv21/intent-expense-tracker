import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { transaction } from "../../db/schema/transaction";
import { category } from "../../db/schema/category";
import { budget } from "../../db/schema/budget";
import { financialProfile } from "../../db/schema/financial-profile";
import { spendingQuerySchema } from "@repo/shared";
import { requireAuth } from "../../lib/session";

export const insightsRoutes = new Hono();

// Get spending summary by category
insightsRoutes.get("/spending", requireAuth, async (c) => {
  const session = c.var.session;
  const searchParams = c.req.query();
  const parsed = spendingQuerySchema.safeParse(searchParams);
  
  if (!parsed.success) {
    throw new HTTPException(400, { 
      message: "Invalid query parameters",
    });
  }
  
  const { startDate, endDate, type, allocationBucket } = parsed.data;
  
  const whereConditions: any[] = [eq(transaction.userId, session.user.id)];
  
  if (startDate) {
    whereConditions.push(gte(transaction.date, new Date(startDate)));
  }
  
  if (endDate) {
    whereConditions.push(lte(transaction.date, new Date(endDate)));
  }
  
  if (type) {
    whereConditions.push(eq(transaction.type, type));
  }
  
  // Build the query
  let query = db
    .select({
      categoryId: transaction.categoryId,
      categoryName: category.name,
      categoryType: category.type,
      allocationBucket: category.allocationBucket,
      icon: category.icon,
      total: sql`CAST(SUM(CAST(${transaction.amount} AS NUMERIC(10,2))) AS TEXT)`,
    })
    .from(transaction)
    .innerJoin(category, eq(transaction.categoryId, category.id))
    .where(and(...whereConditions))
    .groupBy(
      transaction.categoryId,
      category.name,
      category.type,
      category.allocationBucket,
      category.icon,
    )
    .orderBy(category.name);
  
  const result = await query;
  
  // Filter by allocation bucket if specified
  if (allocationBucket) {
    const filtered = result.filter((r) => r.allocationBucket === allocationBucket);
    return c.json(filtered);
  }
  
  return c.json(result);
});

// Get budget status
insightsRoutes.get("/budget-status", requireAuth, async (c) => {
  const session = c.var.session;
  const searchParams = c.req.query();
  const monthStr = searchParams.month; // YYYY-MM format
  
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new HTTPException(400, { message: "month parameter is required (YYYY-MM format)" });
  }
  
  const [yearStr, monthStrParts] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrParts, 10);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month
  
  // Get budgets for the period
  const budgets = await db.query.budget.findMany({
    where: and(
      eq(budget.userId, session.user.id),
      eq(budget.period, "monthly"),
      sql`${budget.startDate} <= ${endDate}`
    ),
    with: {
      category: true,
    },
  });
  
  // Get actual spending per category
  const spending = await db
    .select({
      categoryId: transaction.categoryId,
      total: sql`CAST(SUM(CAST(${transaction.amount} AS NUMERIC(10,2))) AS TEXT)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, session.user.id),
        eq(transaction.type, "expense"),
        gte(transaction.date, startDate),
        lte(transaction.date, endDate),
      ),
    )
    .groupBy(transaction.categoryId);
  
  // Combine budgets with actual spending
  const status = budgets.map((bud) => {
    const spent = spending.find((s) => s.categoryId === bud.categoryId);
    const spentAmount = spent ? parseFloat(spent.total || "0") : 0;
    const budgetAmount = parseFloat(bud.amount);
    
    return {
      budgetId: bud.id,
      categoryId: bud.categoryId,
      categoryName: bud.category.name,
      categoryIcon: bud.category.icon,
      budgetAmount,
      spentAmount,
      remainingAmount: budgetAmount - spentAmount,
      percentage: budgetAmount > 0 ? Math.min(100, Math.round((spentAmount / budgetAmount) * 100)) : 0,
    };
  });
  
  return c.json(status);
});

// Get allocation summary (50/30/20 breakdown)
insightsRoutes.get("/allocation-summary", requireAuth, async (c) => {
  const session = c.var.session;
  const searchParams = c.req.query();
  const monthStr = searchParams.month; // YYYY-MM format
  
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new HTTPException(400, { message: "month parameter is required (YYYY-MM format)" });
  }
  
  const [yearStr, monthStrParts] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrParts, 10);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  // Get financial profile
  const profile = await db.query.financialProfile.findFirst({
    where: eq(financialProfile.userId, session.user.id),
  });
  
  if (!profile) {
    throw new HTTPException(404, { message: "Financial profile not found" });
  }
  
  // Get spending by allocation bucket
  const spending = await db
    .select({
      allocationBucket: category.allocationBucket,
      total: sql`CAST(SUM(CAST(${transaction.amount} AS NUMERIC(10,2))) AS TEXT)`,
    })
    .from(transaction)
    .innerJoin(category, eq(transaction.categoryId, category.id))
    .where(
      and(
        eq(transaction.userId, session.user.id),
        eq(transaction.type, "expense"),
        gte(transaction.date, startDate),
        lte(transaction.date, endDate),
      ),
    )
    .groupBy(category.allocationBucket);
  
  // Calculate totals
  const needsTotal = spending.find((s) => s.allocationBucket === "needs")?.total || "0";
  const wantsTotal = spending.find((s) => s.allocationBucket === "wants")?.total || "0";
  const futureTotal = spending.find((s) => s.allocationBucket === "future")?.total || "0";
  
  const totalSpent = parseFloat(needsTotal) + parseFloat(wantsTotal) + parseFloat(futureTotal);
  
  // Get income for the period
  const incomeResult = await db
    .select({
      total: sql`CAST(SUM(CAST(${transaction.amount} AS NUMERIC(10,2))) AS TEXT)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, session.user.id),
        eq(transaction.type, "income"),
        gte(transaction.date, startDate),
        lte(transaction.date, endDate),
      ),
    );
  
  const incomeTotal = parseFloat(incomeResult[0]?.total || "0");
  
  return c.json({
    income: incomeTotal,
    targets: {
      needs: parseFloat(profile.monthlyIncomeTarget) * (parseFloat(profile.needsPercentage) / 100),
      wants: parseFloat(profile.monthlyIncomeTarget) * (parseFloat(profile.wantsPercentage) / 100),
      future: parseFloat(profile.monthlyIncomeTarget) * (parseFloat(profile.futurePercentage) / 100),
    },
    actual: {
      needs: parseFloat(needsTotal),
      wants: parseFloat(wantsTotal),
      future: parseFloat(futureTotal),
    },
    percentages: {
      needs: totalSpent > 0 ? (parseFloat(needsTotal) / totalSpent) * 100 : 0,
      wants: totalSpent > 0 ? (parseFloat(wantsTotal) / totalSpent) * 100 : 0,
      future: totalSpent > 0 ? (parseFloat(futureTotal) / totalSpent) * 100 : 0,
    },
    profile: {
      monthlyIncomeTarget: parseFloat(profile.monthlyIncomeTarget),
      needsPercentage: parseFloat(profile.needsPercentage),
      wantsPercentage: parseFloat(profile.wantsPercentage),
      futurePercentage: parseFloat(profile.futurePercentage),
    },
  });
});
