import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  period: z.enum(["monthly", "weekly"]),
  startDate: dateSchema,
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  period: z.enum(["monthly", "weekly"]).optional(),
  startDate: dateSchema.optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
