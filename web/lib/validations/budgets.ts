import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  period: z.enum(["monthly", "weekly"]),
  startDate: z.string().min(1),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  period: z.enum(["monthly", "weekly"]).optional(),
  startDate: z.string().min(1).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
