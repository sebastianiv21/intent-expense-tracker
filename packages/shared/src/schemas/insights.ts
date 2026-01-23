import { z } from "zod";

export const allocationSummaryQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // YYYY-MM format
});

export const spendingQuerySchema = z.object({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  type: z.enum(["expense", "income"]).optional(),
  allocationBucket: z.enum(["needs", "wants", "future"]).optional(),
});

export type AllocationSummaryQuery = z.infer<
  typeof allocationSummaryQuerySchema
>;
export type SpendingQuery = z.infer<typeof spendingQuerySchema>;
