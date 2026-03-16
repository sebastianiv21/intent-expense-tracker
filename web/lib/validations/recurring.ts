import { z } from "zod";

const frequencyEnum = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const createRecurringSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  frequency: frequencyEnum,
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export const updateRecurringSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  frequency: frequencyEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
