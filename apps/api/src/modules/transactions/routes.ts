import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "../../db";
import { transaction } from "../../db/schema/transaction";
import { createTransactionSchema, updateTransactionSchema } from "@repo/shared";
import { requireAuth } from "../../lib/session";

export const transactionsRoutes = new Hono();

// Get all transactions for current user (with optional filters)
transactionsRoutes.get("/", requireAuth, async (c) => {
  const session = c.var.session;
  const searchParams = c.req.query();
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;
  const type = searchParams.type as "expense" | "income" | undefined;
  const categoryId = searchParams.categoryId;
  const db = getDb();

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

  if (categoryId) {
    whereConditions.push(eq(transaction.categoryId, categoryId));
  }

  const transactions = await db.query.transaction.findMany({
    where: and(...whereConditions),
    orderBy: [desc(transaction.date), desc(transaction.createdAt)],
    with: {
      category: true,
    },
  });

  return c.json(transactions);
});

// Create new transaction
transactionsRoutes.post("/", requireAuth, async (c) => {
  const session = c.var.session;
  const body = await c.req.json();
  const parsed = createTransactionSchema.safeParse(body);
  const db = getDb();

  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        parsed.error.issues.map((i) => i.message).join(", ") || "Invalid data",
    });
  }

  const newTransaction = await db
    .insert(transaction)
    .values({
      userId: session.user.id,
      categoryId: parsed.data.categoryId || null,
      amount: parsed.data.amount.toString(),
      type: parsed.data.type,
      description: parsed.data.description,
      date: new Date(parsed.data.date),
    })
    .returning();

  const created = await db.query.transaction.findFirst({
    where: eq(transaction.id, newTransaction[0]!.id),
    with: {
      category: true,
    },
  });

  return c.json(created, 201);
});

// Get transaction by ID
transactionsRoutes.get("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  const db = getDb();

  const txn = await db.query.transaction.findFirst({
    where: and(eq(transaction.id, id), eq(transaction.userId, session.user.id)),
    with: {
      category: true,
    },
  });

  if (!txn) {
    throw new HTTPException(404, { message: "Transaction not found" });
  }

  return c.json(txn);
});

// Update transaction
transactionsRoutes.patch("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateTransactionSchema.safeParse(body);
  const db = getDb();

  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        parsed.error.issues.map((i) => i.message).join(", ") || "Invalid data",
    });
  }

  // Verify transaction exists and belongs to user
  const existing = await db.query.transaction.findFirst({
    where: and(eq(transaction.id, id), eq(transaction.userId, session.user.id)),
  });

  if (!existing) {
    throw new HTTPException(404, { message: "Transaction not found" });
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (parsed.data.categoryId !== undefined) {
    updateData.categoryId = parsed.data.categoryId;
  }
  if (parsed.data.amount !== undefined) {
    updateData.amount = parsed.data.amount.toString();
  }
  if (parsed.data.type !== undefined) {
    updateData.type = parsed.data.type;
  }
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description;
  }
  if (parsed.data.date !== undefined) {
    updateData.date = new Date(parsed.data.date);
  }

  const updated = await db
    .update(transaction)
    .set(updateData)
    .where(and(eq(transaction.id, id), eq(transaction.userId, session.user.id)))
    .returning();

  const result = await db.query.transaction.findFirst({
    where: eq(transaction.id, updated[0]!.id),
    with: {
      category: true,
    },
  });

  return c.json(result);
});

// Delete transaction
transactionsRoutes.delete("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  const db = getDb();

  // Verify transaction exists and belongs to user
  const existing = await db.query.transaction.findFirst({
    where: and(eq(transaction.id, id), eq(transaction.userId, session.user.id)),
  });

  if (!existing) {
    throw new HTTPException(404, { message: "Transaction not found" });
  }

  await db
    .delete(transaction)
    .where(
      and(eq(transaction.id, id), eq(transaction.userId, session.user.id)),
    );

  return c.json({ message: "Transaction deleted successfully" });
});
