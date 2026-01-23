import { z } from "zod";

export const createFinancialProfileSchema = z
  .object({
    monthlyIncomeTarget: z
      .number()
      .positive("Monthly income must be positive")
      .max(1_000_000_000, "Monthly income seems too high"),
    needsPercentage: z
      .number()
      .min(0, "Percentage cannot be negative")
      .max(100, "Percentage cannot exceed 100")
      .default(50),
    wantsPercentage: z
      .number()
      .min(0, "Percentage cannot be negative")
      .max(100, "Percentage cannot exceed 100")
      .default(30),
    futurePercentage: z
      .number()
      .min(0, "Percentage cannot be negative")
      .max(100, "Percentage cannot exceed 100")
      .default(20),
  })
  .refine(
    (data) => {
      const sum =
        data.needsPercentage + data.wantsPercentage + data.futurePercentage;
      return Math.abs(sum - 100) < 0.01; // Float precision tolerance
    },
    {
      message: "Percentages must sum to exactly 100%",
      path: ["futurePercentage"],
    },
  );

export const updateFinancialProfileSchema = z
  .object({
    monthlyIncomeTarget: z.number().positive().max(1_000_000_000).optional(),
    needsPercentage: z.number().min(0).max(100).optional(),
    wantsPercentage: z.number().min(0).max(100).optional(),
    futurePercentage: z.number().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      const hasAnyPercentage =
        data.needsPercentage !== undefined ||
        data.wantsPercentage !== undefined ||
        data.futurePercentage !== undefined;

      if (!hasAnyPercentage) return true;

      // If updating percentages, all three must be provided
      if (
        data.needsPercentage === undefined ||
        data.wantsPercentage === undefined ||
        data.futurePercentage === undefined
      ) {
        return false;
      }

      const sum =
        data.needsPercentage + data.wantsPercentage + data.futurePercentage;
      return Math.abs(sum - 100) < 0.01;
    },
    {
      message:
        "When updating percentages, all three must be provided and sum to 100%",
    },
  );

export type CreateFinancialProfile = z.infer<
  typeof createFinancialProfileSchema
>;
export type UpdateFinancialProfile = z.infer<
  typeof updateFinancialProfileSchema
>;
