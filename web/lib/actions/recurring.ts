"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { financialProfile, recurringTransactions, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { getOrFetchExchangeRate } from "@/lib/exchange-rates";
import { firstDueOnOrAfter, planOccurrences } from "@/lib/recurring-schedule";
import {
  createRecurringSchema,
  updateRecurringSchema,
} from "@/lib/validations/recurring";
import type { ActionResult, RecurringTransaction } from "@/types";

// Resolves the user's base currency from their financial profile (defaults to USD).
async function getBaseCurrency(userId: string): Promise<string> {
  const rows = await db
    .select({ currency: financialProfile.currency })
    .from(financialProfile)
    .where(eq(financialProfile.userId, userId))
    .limit(1);
  return rows[0]?.currency ?? "USD";
}

export async function createRecurring(
  formData: unknown,
): Promise<ActionResult<RecurringTransaction>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createRecurringSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const {
    amount,
    type,
    description,
    frequency,
    startDate,
    endDate,
    categoryId,
    currency,
    baseCurrency,
  } = parsed.data;

  const today = format(new Date(), "yyyy-MM-dd");

  // Convert to base currency for storage. Reference date is clamped to today because the
  // historical-rate API 404s on future start dates; per-generation dates re-fetch anyway.
  let exchangeRate: number;
  try {
    exchangeRate = await getOrFetchExchangeRate(currency, baseCurrency, today);
  } catch {
    return {
      success: false,
      error: "Couldn't fetch exchange rate — please try again.",
    };
  }

  try {
    const result = await db
      .insert(recurringTransactions)
      .values({
        userId,
        amount: (amount * exchangeRate).toFixed(2),
        originalAmount: amount.toFixed(2),
        currency,
        exchangeRate: exchangeRate.toString(),
        type,
        description: description ?? null,
        frequency,
        startDate,
        endDate: endDate ?? null,
        nextDueDate: firstDueOnOrAfter(startDate, frequency, today),
        categoryId: categoryId ?? null,
        isActive: true,
      })
      .returning();

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: result[0] as RecurringTransaction };
  } catch (err) {
    console.error("Failed to create recurring transaction:", err);
    return { success: false, error: "Failed to create recurring transaction" };
  }
}

export async function updateRecurring(
  id: string,
  data: unknown,
): Promise<ActionResult<RecurringTransaction>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = updateRecurringSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  // Pre-read required to compare start date (schedule) and existing currency/rate.
  const existing = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    return { success: false, error: "Recurring transaction not found" };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const updateValues: Record<string, string | boolean | null> = {};

  // Recompute stored base amount / rate only when amount or currency changes.
  if (parsed.data.amount !== undefined || parsed.data.currency !== undefined) {
    const newCurrency = parsed.data.currency ?? existing[0].currency;
    const baseCurrency =
      parsed.data.baseCurrency ?? (await getBaseCurrency(userId));
    const originalAmount =
      parsed.data.amount ?? Number(existing[0].originalAmount);

    let exchangeRate: number;
    try {
      exchangeRate = await getOrFetchExchangeRate(
        newCurrency,
        baseCurrency,
        today,
      );
    } catch {
      return {
        success: false,
        error: "Couldn't fetch exchange rate — please try again.",
      };
    }

    updateValues.currency = newCurrency;
    updateValues.originalAmount = originalAmount.toFixed(2);
    updateValues.exchangeRate = exchangeRate.toString();
    updateValues.amount = (originalAmount * exchangeRate).toFixed(2);
  }
  if (parsed.data.type !== undefined) {
    updateValues.type = parsed.data.type;
  }
  if (parsed.data.description !== undefined) {
    updateValues.description = parsed.data.description ?? null;
  }
  if (parsed.data.frequency !== undefined) {
    updateValues.frequency = parsed.data.frequency;
  }
  if (parsed.data.startDate !== undefined) {
    updateValues.startDate = parsed.data.startDate;
    // Only reschedule when the start date actually changed — editing other fields must
    // not rewind nextDueDate (which would re-generate every past period as duplicates).
    if (parsed.data.startDate !== existing[0].startDate) {
      const frequency = parsed.data.frequency ?? existing[0].frequency;
      updateValues.nextDueDate = firstDueOnOrAfter(
        parsed.data.startDate,
        frequency,
        today,
      );
    }
  }
  if (parsed.data.endDate !== undefined) {
    updateValues.endDate = parsed.data.endDate ?? null;
  }
  if (parsed.data.isActive !== undefined) {
    updateValues.isActive = parsed.data.isActive;
    // Resuming a paused item: roll the schedule forward to the next occurrence on/after
    // today so periods that elapsed while paused are skipped, not backfilled on the next
    // processing run. (Guard: don't override a nextDueDate a start-date change just set.)
    if (
      parsed.data.isActive === true &&
      existing[0].isActive === false &&
      updateValues.nextDueDate === undefined
    ) {
      const frequency = parsed.data.frequency ?? existing[0].frequency;
      updateValues.nextDueDate = firstDueOnOrAfter(
        existing[0].nextDueDate,
        frequency,
        today,
        existing[0].startDate,
      );
    }
  }
  if (parsed.data.categoryId !== undefined) {
    updateValues.categoryId = parsed.data.categoryId ?? null;
  }

  try {
    const result = await db
      .update(recurringTransactions)
      .set(updateValues)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, userId),
        ),
      )
      .returning();

    if (!result[0]) {
      return { success: false, error: "Recurring transaction not found" };
    }

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, data: result[0] as RecurringTransaction };
  } catch (err) {
    console.error("Failed to update recurring transaction:", err);
    return { success: false, error: "Failed to update recurring transaction" };
  }
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const { userId } = await getAuthenticatedUser();

  try {
    const result = await db
      .delete(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, userId),
        ),
      )
      .returning();

    if (!result[0]) {
      return { success: false, error: "Recurring transaction not found" };
    }

    revalidatePath("/recurring");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Failed to delete recurring transaction:", err);
    return { success: false, error: "Failed to delete recurring transaction" };
  }
}

export async function processRecurringTransactions(): Promise<{
  generated: number;
}> {
  const { userId } = await getAuthenticatedUser();
  const today = format(new Date(), "yyyy-MM-dd");

  // Look up the user's base currency so generated transactions use the correct currency
  // instead of a hardcoded "USD" that would be wrong for COP users.
  const profileRows = await db
    .select({ currency: financialProfile.currency })
    .from(financialProfile)
    .where(eq(financialProfile.userId, userId))
    .limit(1);
  const baseCur = profileRows[0]?.currency ?? "USD";

  try {
    const dueItems = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactions.isActive, true),
          lte(recurringTransactions.nextDueDate, today),
        ),
      );

    let generated = 0;

    for (const item of dueItems) {
      // Process all overdue periods, not just one
      for (const { dueDate, nextDue, deactivate } of planOccurrences(
        item,
        today,
      )) {
        // Convert the item's currency to base at this due date's rate. Same-currency
        // short-circuits to 1.0 (no fetch); on fetch failure fall back to the last known
        // rate stored on the item — this is a background job with no user to retry.
        let rate = 1.0;
        if (item.currency !== baseCur) {
          try {
            rate = await getOrFetchExchangeRate(item.currency, baseCur, dueDate);
          } catch {
            rate = Number(item.exchangeRate);
          }
        }
        const convertedAmount = (Number(item.originalAmount) * rate).toFixed(2);

        // Claim-then-insert to avoid double-generation under concurrent requests.
        // The guarded UPDATE (nextDueDate = dueDate) is a compare-and-swap: only one
        // racing request can advance the row from this due date, and only that request
        // inserts. The loser matches 0 rows and bails. Both writes share one transaction so
        // a failed insert rolls back the claim.
        const claimed = await db.transaction(async (tx) => {
          const advanced = await tx
            .update(recurringTransactions)
            .set({
              nextDueDate: nextDue,
              lastGeneratedDate: dueDate,
              isActive: deactivate ? false : item.isActive,
            })
            .where(
              and(
                eq(recurringTransactions.id, item.id),
                eq(recurringTransactions.nextDueDate, dueDate),
              ),
            )
            .returning({ id: recurringTransactions.id });

          if (advanced.length === 0) return false; // another request already advanced it

          await tx.insert(transactions).values({
            userId,
            amount: convertedAmount,       // base-currency value at this due date
            originalAmount: item.originalAmount, // as entered, in item.currency
            currency: item.currency,
            exchangeRate: rate.toString(),
            type: item.type,
            description: item.description,
            date: dueDate,
            categoryId: item.categoryId,
          });

          return true;
        });

        // Lost the claim — another concurrent run owns this item; stop processing it.
        if (!claimed) break;

        generated += 1;
      }
    }

    return { generated };
  } catch (err) {
    console.error("Failed to process recurring transactions:", err);
    return { generated: 0 };
  }
}
