import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  date: dateSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),          // NEW
  baseCurrency: z.enum(SUPPORTED_CURRENCIES),                 // required — needed for correct exchange-rate recalculation
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
