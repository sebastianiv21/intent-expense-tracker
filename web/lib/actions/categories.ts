"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/categories";
import type { ActionResult, Category } from "@/types";

export async function createCategory(
  formData: unknown,
): Promise<ActionResult<Category>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createCategorySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const { name, type, icon, allocationBucket } = parsed.data;

  try {
    const result = await db
      .insert(categories)
      .values({
        userId,
        name,
        type,
        icon: icon ?? null,
        allocationBucket: type === "income" ? null : (allocationBucket ?? null),
      })
      .returning();

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true, data: result[0] as Category };
  } catch (err) {
    console.error("Failed to create category:", err);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  data: unknown,
): Promise<ActionResult<Category>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = updateCategorySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    };
  }

  const updateValues: Record<string, string | null> = {};

  if (parsed.data.name !== undefined) {
    updateValues.name = parsed.data.name;
  }
  if (parsed.data.icon !== undefined) {
    updateValues.icon = parsed.data.icon ?? null;
  }
  if (parsed.data.allocationBucket !== undefined) {
    updateValues.allocationBucket = parsed.data.allocationBucket ?? null;
  }

  if (Object.keys(updateValues).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  try {
    const result = await db
      .update(categories)
      .set(updateValues)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Category not found" };
    }

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true, data: result[0] as Category };
  } catch (err) {
    console.error("Failed to update category:", err);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { userId } = await getAuthenticatedUser();

  try {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Category not found" };
    }

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/budgets");

    return { success: true };
  } catch (err) {
    console.error("Failed to delete category:", err);
    return { success: false, error: "Failed to delete category" };
  }
}
