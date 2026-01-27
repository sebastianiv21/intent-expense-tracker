import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../../db";
import { budget } from "../../db/schema/budget";
import { category } from "../../db/schema/category";
import { createBudgetSchema, updateBudgetSchema } from "@repo/shared";
import { requireAuth } from "../../lib/session";

export const budgetsRoutes = new Hono();

// Get all budgets for current user
budgetsRoutes.get("/", requireAuth, async (c) => {
  const session = c.var.session;
  
  const budgets = await db.query.budget.findMany({
    where: eq(budget.userId, session.user.id),
    orderBy: [budget.period, budget.startDate],
    with: {
      category: true,
    },
  });
  
  return c.json(budgets);
});

// Create new budget
budgetsRoutes.post("/", requireAuth, async (c) => {
  const session = c.var.session;
  const body = await c.req.json();
  const parsed = createBudgetSchema.safeParse(body);
  
  if (!parsed.success) {
    throw new HTTPException(400, { 
      message: "Invalid data",
    });
  }
  
  // Verify category exists and belongs to user
  const cat = await db.query.category.findFirst({
    where: and(
      eq(category.id, parsed.data.categoryId),
      eq(category.userId, session.user.id)
    ),
  });
  
  if (!cat) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  
  const newBudget = await db
    .insert(budget)
    .values({
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount.toString(),
      period: parsed.data.period,
      startDate: new Date(parsed.data.startDate),
    })
    .returning();
  
  const created = await db.query.budget.findFirst({
    where: eq(budget.id, newBudget[0]?.id),
    with: {
      category: true,
    },
  });
  
  return c.json(created, 201);
});

// Get budget by ID
budgetsRoutes.get("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  
  const bud = await db.query.budget.findFirst({
    where: and(eq(budget.id, id), eq(budget.userId, session.user.id)),
    with: {
      category: true,
    },
  });
  
  if (!bud) {
    throw new HTTPException(404, { message: "Budget not found" });
  }
  
  return c.json(bud);
});

// Update budget
budgetsRoutes.patch("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateBudgetSchema.safeParse(body);
  
  if (!parsed.success) {
    throw new HTTPException(400, { 
      message: "Invalid data",
    });
  }
  
  // Verify budget exists and belongs to user
  const existing = await db.query.budget.findFirst({
    where: and(eq(budget.id, id), eq(budget.userId, session.user.id)),
  });
  
  if (!existing) {
    throw new HTTPException(404, { message: "Budget not found" });
  }
  
  const updateData: any = {
    updatedAt: new Date(),
  };
  
  if (parsed.data.amount !== undefined) {
    updateData.amount = parsed.data.amount.toString();
  }
  if (parsed.data.period !== undefined) {
    updateData.period = parsed.data.period;
  }
  if (parsed.data.startDate !== undefined) {
    updateData.startDate = new Date(parsed.data.startDate);
  }
  
  const updated = await db
    .update(budget)
    .set(updateData)
    .where(and(eq(budget.id, id), eq(budget.userId, session.user.id)))
    .returning();
  
  const result = await db.query.budget.findFirst({
    where: eq(budget.id, updated[0]?.id),
    with: {
      category: true,
    },
  });
  
  return c.json(result);
});

// Delete budget
budgetsRoutes.delete("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  
  // Verify budget exists and belongs to user
  const existing = await db.query.budget.findFirst({
    where: and(eq(budget.id, id), eq(budget.userId, session.user.id)),
  });
  
  if (!existing) {
    throw new HTTPException(404, { message: "Budget not found" });
  }
  
  await db.delete(budget).where(and(eq(budget.id, id), eq(budget.userId, session.user.id)));
  
  return c.json({ message: "Budget deleted successfully" });
});
