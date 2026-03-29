"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { financialProfile } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import {
  createFinancialProfileSchema,
  updateFinancialProfileSchema,
} from "@/lib/validations/financial-profile";
import type { ActionResult, FinancialProfile } from "@/types";

export async function createFinancialProfile(
  formData: unknown,
): Promise<ActionResult<FinancialProfile>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createFinancialProfileSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const {
    monthlyIncomeTarget,
    needsPercentage,
    wantsPercentage,
    futurePercentage,
    currency,
  } = parsed.data;

  try {
    const existing = await db
      .select({ userId: financialProfile.userId })
      .from(financialProfile)
      .where(eq(financialProfile.userId, userId))
      .limit(1);

    if (existing[0]) {
      return { success: false, error: "Financial profile already exists" };
    }

    const result = await db
      .insert(financialProfile)
      .values({
        userId,
        monthlyIncomeTarget: monthlyIncomeTarget.toFixed(2),
        needsPercentage: needsPercentage.toFixed(2),
        wantsPercentage: wantsPercentage.toFixed(2),
        futurePercentage: futurePercentage.toFixed(2),
        currency,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/budgets");
    revalidatePath("/insights");

    return { success: true, data: result[0] as FinancialProfile };
  } catch (err) {
    console.error("Failed to create financial profile:", err);
    return { success: false, error: "Failed to create financial profile" };
  }
}

export async function updateFinancialProfile(
  formData: unknown,
): Promise<ActionResult<FinancialProfile>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = updateFinancialProfileSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const {
    monthlyIncomeTarget,
    needsPercentage,
    wantsPercentage,
    futurePercentage,
    currency,
  } = parsed.data;

  const updateValues: Record<string, string | Date> = {
    updatedAt: new Date(),
  };

  if (monthlyIncomeTarget !== undefined) {
    updateValues.monthlyIncomeTarget = monthlyIncomeTarget.toFixed(2);
  }
  if (needsPercentage !== undefined) {
    updateValues.needsPercentage = needsPercentage.toFixed(2);
  }
  if (wantsPercentage !== undefined) {
    updateValues.wantsPercentage = wantsPercentage.toFixed(2);
  }
  if (futurePercentage !== undefined) {
    updateValues.futurePercentage = futurePercentage.toFixed(2);
  }
  if (currency !== undefined) {
    updateValues.currency = currency;
  }

  try {
    const result = await db
      .update(financialProfile)
      .set(updateValues)
      .where(eq(financialProfile.userId, userId))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Financial profile not found" };
    }

    revalidatePath("/");
    revalidatePath("/budgets");
    revalidatePath("/insights");

    return { success: true, data: result[0] as FinancialProfile };
  } catch (err) {
    console.error("Failed to update financial profile:", err);
    return { success: false, error: "Failed to update financial profile" };
  }
}
