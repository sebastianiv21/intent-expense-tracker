import { z } from "zod";

const percentageSchema = z.coerce.number().min(0).max(100);

function sumsToHundred(a: number, b: number, c: number): boolean {
  return Math.abs(a + b + c - 100) < 0.01;
}

export const createFinancialProfileSchema = z
  .object({
    monthlyIncomeTarget: z.coerce
      .number()
      .positive("Monthly income must be greater than 0"),
    needsPercentage: percentageSchema.default(50),
    wantsPercentage: percentageSchema.default(30),
    futurePercentage: percentageSchema.default(20),
  })
  .refine(
    (data) =>
      sumsToHundred(
        data.needsPercentage,
        data.wantsPercentage,
        data.futurePercentage,
      ),
    {
      message: "Percentages must sum to 100",
      path: ["needsPercentage"],
    },
  );

export const updateFinancialProfileSchema = z
  .object({
    monthlyIncomeTarget: z.coerce.number().positive().optional(),
    needsPercentage: percentageSchema.optional(),
    wantsPercentage: percentageSchema.optional(),
    futurePercentage: percentageSchema.optional(),
  })
  .refine(
    (data) => {
      const { needsPercentage, wantsPercentage, futurePercentage } = data;
      const anySet =
        needsPercentage !== undefined ||
        wantsPercentage !== undefined ||
        futurePercentage !== undefined;
      if (!anySet) return true;
      const allSet =
        needsPercentage !== undefined &&
        wantsPercentage !== undefined &&
        futurePercentage !== undefined;
      if (!allSet) return false;
      return sumsToHundred(needsPercentage, wantsPercentage, futurePercentage);
    },
    {
      message:
        "If updating percentages, all three must be provided and sum to 100",
      path: ["needsPercentage"],
    },
  );

export type CreateFinancialProfileInput = z.infer<
  typeof createFinancialProfileSchema
>;
export type UpdateFinancialProfileInput = z.infer<
  typeof updateFinancialProfileSchema
>;
