"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgets } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "@/lib/validations/budgets";
import type { ActionResult, Budget } from "@/types";

export async function createBudget(
  formData: unknown,
): Promise<ActionResult<Budget>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createBudgetSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const { amount, categoryId, period, startDate } = parsed.data;

  try {
    const result = await db
      .insert(budgets)
      .values({
        userId,
        categoryId,
        amount: amount.toFixed(2),
        period,
        startDate,
      })
      .returning();

    revalidatePath("/budgets");
    revalidatePath("/");

    return { success: true, data: result[0] as Budget };
  } catch (err) {
    console.error("Failed to create budget:", err);
    return { success: false, error: "Failed to create budget" };
  }
}

export async function updateBudget(
  id: string,
  data: unknown,
): Promise<ActionResult<Budget>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = updateBudgetSchema.safeParse(data);
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
  if (parsed.data.period !== undefined) {
    updateValues.period = parsed.data.period;
  }
  if (parsed.data.startDate !== undefined) {
    updateValues.startDate = parsed.data.startDate;
  }

  if (Object.keys(updateValues).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  try {
    const result = await db
      .update(budgets)
      .set(updateValues)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Budget not found" };
    }

    revalidatePath("/budgets");
    revalidatePath("/");

    return { success: true, data: result[0] as Budget };
  } catch (err) {
    console.error("Failed to update budget:", err);
    return { success: false, error: "Failed to update budget" };
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const { userId } = await getAuthenticatedUser();

  try {
    const result = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Budget not found" };
    }

    revalidatePath("/budgets");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Failed to delete budget:", err);
    return { success: false, error: "Failed to delete budget" };
  }
}
