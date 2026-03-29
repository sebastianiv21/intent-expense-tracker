import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const frequencyEnum = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const createRecurringSchema = z
  .object({
    amount: z.number().positive(),
    type: z.enum(["expense", "income"]),
    description: z.string().max(255).optional(),
    frequency: frequencyEnum,
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    categoryId: z.string().uuid().optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const updateRecurringSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  frequency: frequencyEnum.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
