import { z } from "zod";

const bucketEnum = z.enum(["needs", "wants", "future"]);

export const createCategorySchema = z
  .object({
    name: z.string().min(1).max(100),
    type: z.enum(["expense", "income"]),
    icon: z.string().max(10).optional(),
    allocationBucket: bucketEnum.optional(),
  })
  .refine(
    (data) =>
      data.type === "income" || data.allocationBucket !== undefined,
    {
      message: "Allocation bucket is required for expense categories",
      path: ["allocationBucket"],
    }
  );

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  allocationBucket: bucketEnum.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
