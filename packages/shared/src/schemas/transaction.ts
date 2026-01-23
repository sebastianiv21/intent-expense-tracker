import { z } from "zod";

export const transactionTypeEnum = z.enum(["expense", "income"]);

export const createTransactionSchema = z.object({
  categoryId: z.uuidv4().nullable().optional(),
  amount: z.number().positive("Amount must be positive"),
  type: transactionTypeEnum,
  description: z.string().max(255).optional(),
  date: z.iso.date(),
});

export const updateTransactionSchema = z.object({
  categoryId: z.uuidv4().nullable().optional(),
  amount: z.number().positive().optional(),
  type: transactionTypeEnum.optional(),
  description: z.string().max(255).optional(),
  date: z.iso.date().optional(),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type TransactionType = z.infer<typeof transactionTypeEnum>;
