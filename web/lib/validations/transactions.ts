import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const currencyCodeSchema = z
  .string()
  .length(3)
  .refine((code) => SUPPORTED_CURRENCIES.some((c) => c.code === code), {
    message: "Unsupported currency code",
  });

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
  currency: currencyCodeSchema,
  baseCurrency: currencyCodeSchema,
});

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  date: dateSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  currency: currencyCodeSchema.optional(),
  baseCurrency: currencyCodeSchema, // required — needed for correct exchange-rate recalculation
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
