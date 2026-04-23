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
import { getOrFetchExchangeRate } from "@/lib/exchange-rates";
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

  const { amount, type, description, date, categoryId, currency, baseCurrency } = parsed.data;

  // Fetch exchange rate — throws on failure (D-01), returns 1.0 for same-currency (D-06)
  let exchangeRate: number;
  try {
    exchangeRate = await getOrFetchExchangeRate(currency, baseCurrency, date);
  } catch {
    return { success: false, error: "Couldn't fetch exchange rate — please try again." };
  }

  const originalAmount = amount;
  const convertedAmount = originalAmount * exchangeRate;

  try {
    const result = await db
      .insert(transactions)
      .values({
        userId,
        amount: convertedAmount.toFixed(2),        // base-currency value (DATA-03: all dashboard queries read this)
        originalAmount: originalAmount.toFixed(2),  // as entered in transaction currency
        exchangeRate: exchangeRate.toString(),       // full precision — never toFixed() for rates (numeric(20,10))
        currency,
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

  // Pre-read required to detect currency/date change (D-05)
  // Single row lookup guarded by userId — consistent with auth pattern
  const existing = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  if (!existing[0]) {
    return { success: false, error: "Transaction not found" };
  }

  const newCurrency = parsed.data.currency ?? existing[0].currency;
  const newDate = parsed.data.date ?? existing[0].date;
  const currencyChanged = newCurrency !== existing[0].currency;
  const dateChanged = newDate !== existing[0].date;

  // Use Record with broad value type to accommodate number fields alongside strings
  const updateValues: Record<string, string | number | null> = {};

  if (currencyChanged || dateChanged) {
    // Re-fetch rate when currency or date changes (D-05)
    const baseCurrency = parsed.data.baseCurrency ?? existing[0].currency;
    let exchangeRate: number;
    try {
      exchangeRate = await getOrFetchExchangeRate(newCurrency, baseCurrency, newDate);
    } catch {
      return { success: false, error: "Couldn't fetch exchange rate — please try again." };
    }
    // CRITICAL: Drizzle numeric → string at runtime; always Number() before arithmetic
    const originalAmount = parsed.data.amount ?? Number(existing[0].originalAmount);
    updateValues.currency = newCurrency;
    updateValues.exchangeRate = exchangeRate.toString();
    updateValues.originalAmount = originalAmount.toFixed(2);
    updateValues.amount = (originalAmount * exchangeRate).toFixed(2);
  } else if (parsed.data.amount !== undefined) {
    // Amount changed but not currency/date — preserve stored rate, recompute base amount
    const rate = Number(existing[0].exchangeRate);
    updateValues.originalAmount = parsed.data.amount.toFixed(2);
    updateValues.amount = (parsed.data.amount * rate).toFixed(2);
  }

  // Remaining non-currency fields follow existing pattern
  if (parsed.data.type !== undefined) updateValues.type = parsed.data.type;
  if (parsed.data.description !== undefined) {
    updateValues.description = parsed.data.description ?? null;
  }
  if (parsed.data.date !== undefined) updateValues.date = parsed.data.date;
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

/**
 * Thin server action wrapper over getOrFetchExchangeRate.
 * Used by TransactionSheet to fetch the rate on currency selection for the conversion preview.
 * Returns { rate } on success or { error } on failure — does NOT use ActionResult<T>
 * because this is a query helper, not a mutation.
 */
export async function getExchangeRateForPreview(
  from: string,
  to: string,
  date: string,
): Promise<{ rate: number } | { error: string }> {
  await getAuthenticatedUser(); // consistent with all existing actions
  try {
    const rate = await getOrFetchExchangeRate(from, to, date);
    return { rate };
  } catch {
    return { error: "Couldn't fetch exchange rate" };
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
  await getAuthenticatedUser(); // auth boundary — consistent with all other actions
  return getTransactions({
    ...params,
    limit: 10_000,
    orderBy: "date_desc",
  });
}
