import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const SUPPORTED_CURRENCIES = ["USD", "COP"] as const;

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),      // the transaction's currency (D-02)
  baseCurrency: z.enum(SUPPORTED_CURRENCIES).default("USD"),  // user's base currency for conversion (Pattern 3)
});

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  date: dateSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),          // NEW
  baseCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),      // NEW
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
