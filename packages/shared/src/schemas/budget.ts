import { z } from "zod";

export const budgetPeriodEnum = z.enum(["monthly", "weekly"]);

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive("Budget amount must be positive"),
  period: budgetPeriodEnum.default("monthly"),
  startDate: z.string(),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  period: budgetPeriodEnum.optional(),
  startDate: z.string().optional(),
});

export type CreateBudget = z.infer<typeof createBudgetSchema>;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;
export type BudgetPeriod = z.infer<typeof budgetPeriodEnum>;
