"use server";

import { revalidatePath } from "next/cache";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { recurringTransactions, transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import {
  createRecurringSchema,
  updateRecurringSchema,
} from "@/lib/validations/recurring";
import type { ActionResult, RecurringTransaction } from "@/types";

function nextDueDate(date: Date, frequency: string) {
  switch (frequency) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "biweekly":
      return addWeeks(date, 2);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

export async function createRecurring(
  formData: unknown
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

  const { amount, type, description, frequency, startDate, endDate, categoryId } =
    parsed.data;

  const result = await db
    .insert(recurringTransactions)
    .values({
      userId,
      amount: amount.toFixed(2),
      type,
      description: description ?? null,
      frequency,
      startDate,
      endDate: endDate ?? null,
      nextDueDate: startDate,
      categoryId: categoryId ?? null,
      isActive: true,
    })
    .returning();

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");

  return { success: true, data: result[0] as RecurringTransaction };
}

export async function updateRecurring(
  id: string,
  data: unknown
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

  const updateValues: Record<string, string | boolean | null> = {};

  if (parsed.data.amount !== undefined) {
    updateValues.amount = parsed.data.amount.toFixed(2);
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
    updateValues.nextDueDate = parsed.data.startDate;
  }
  if (parsed.data.endDate !== undefined) {
    updateValues.endDate = parsed.data.endDate ?? null;
  }
  if (parsed.data.isActive !== undefined) {
    updateValues.isActive = parsed.data.isActive;
  }
  if (parsed.data.categoryId !== undefined) {
    updateValues.categoryId = parsed.data.categoryId ?? null;
  }

  const result = await db
    .update(recurringTransactions)
    .set(updateValues)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
    .returning();

  if (!result[0]) {
    return { success: false, error: "Recurring transaction not found" };
  }

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");

  return { success: true, data: result[0] as RecurringTransaction };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const { userId } = await getAuthenticatedUser();

  const result = await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
    .returning();

  if (!result[0]) {
    return { success: false, error: "Recurring transaction not found" };
  }

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");

  return { success: true };
}

export async function processRecurringTransactions(): Promise<{ generated: number }> {
  const { userId } = await getAuthenticatedUser();
  const today = format(new Date(), "yyyy-MM-dd");

  const dueItems = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextDueDate, today)
      )
    );

  let generated = 0;

  for (const item of dueItems) {
    const nextDate = new Date(item.nextDueDate);
    const computedNext = nextDueDate(nextDate, item.frequency);
    const nextDue = format(computedNext, "yyyy-MM-dd");

    await db.insert(transactions).values({
      userId,
      amount: item.amount,
      type: item.type,
      description: item.description,
      date: item.nextDueDate,
      categoryId: item.categoryId,
    });

    const shouldDeactivate = item.endDate && item.endDate < nextDue;

    await db
      .update(recurringTransactions)
      .set({
        nextDueDate: nextDue,
        lastGeneratedDate: item.nextDueDate,
        isActive: shouldDeactivate ? false : item.isActive,
      })
      .where(eq(recurringTransactions.id, item.id));

    generated += 1;
  }

  return { generated };
}
