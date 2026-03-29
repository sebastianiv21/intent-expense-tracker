"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { getTransactions } from "@/lib/queries/transactions";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transactions";
import type {
  ActionResult,
  FilterState,
  Transaction,
  TransactionBatch,
  TransactionType,
  TransactionWithCategory,
} from "@/types";

export async function createTransaction(
  formData: unknown,
): Promise<ActionResult<Transaction>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createTransactionSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const { amount, type, description, date, categoryId } = parsed.data;

  try {
    const result = await db
      .insert(transactions)
      .values({
        userId,
        amount: amount.toFixed(2),
        type,
        description: description ?? null,
        date,
        categoryId: categoryId ?? null,
      })
      .returning();

    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: result[0] as Transaction };
  } catch (err) {
    console.error("Failed to create transaction:", err);
    return { success: false, error: "Failed to create transaction" };
  }
}

export async function updateTransaction(
  id: string,
  data: unknown,
): Promise<ActionResult<Transaction>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = updateTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const updateValues: Record<string, string | null> = {};

  if (parsed.data.amount !== undefined) {
    updateValues.amount = parsed.data.amount.toFixed(2);
  }
  if (parsed.data.type !== undefined) {
    updateValues.type = parsed.data.type;
  }
  if (parsed.data.description !== undefined) {
    updateValues.description = parsed.data.description ?? null;
  }
  if (parsed.data.date !== undefined) {
    updateValues.date = parsed.data.date;
  }
  if (parsed.data.categoryId !== undefined) {
    updateValues.categoryId = parsed.data.categoryId;
  }

  try {
    const result = await db
      .update(transactions)
      .set(updateValues)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Transaction not found" };
    }

    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: result[0] as Transaction };
  } catch (err) {
    console.error("Failed to update transaction:", err);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { userId } = await getAuthenticatedUser();

  try {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Transaction not found" };
    }

    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Failed to delete transaction:", err);
    return { success: false, error: "Failed to delete transaction" };
  }
}

export async function loadMoreTransactions(params: {
  limit: number;
  offset: number;
  type?: TransactionType;
  search?: string;
}): Promise<TransactionBatch> {
  // Clamp limit to prevent abuse
  const limit = Math.min(Math.max(params.limit, 1), 100);
  const offset = Math.max(params.offset, 0);

  const rows = await getTransactions({
    type: params.type,
    search: params.search,
    limit: limit + 1,
    offset,
    orderBy: "date_desc",
  });

  return {
    transactions: rows.slice(0, limit),
    hasMore: rows.length > limit,
  };
}

export async function exportTransactions(
  params: FilterState,
): Promise<TransactionWithCategory[]> {
  return getTransactions({
    ...params,
    limit: 10_000,
    orderBy: "date_desc",
  });
}
