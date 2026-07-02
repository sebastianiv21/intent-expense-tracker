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
    currency: currencyCodeSchema.default("USD"), // the item's currency
    baseCurrency: currencyCodeSchema.default("USD"), // user's base currency for conversion
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
  currency: currencyCodeSchema.optional(),
  // Optional because pause/resume toggles send only { isActive }. When amount or
  // currency changes, the action resolves the base currency (payload → profile fallback).
  baseCurrency: currencyCodeSchema.optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
