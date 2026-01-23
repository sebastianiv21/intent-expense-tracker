import { z } from "zod";

export const allocationBucketEnum = z.enum(["needs", "wants", "future"]);
export const categoryTypeEnum = z.enum(["expense", "income"]);

export const createCategorySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50),
    type: categoryTypeEnum,
    allocationBucket: allocationBucketEnum.nullable(),
    icon: z.string().max(10).optional(),
  })
  .refine(
    (data) => {
      // Income categories should not have allocation bucket
      if (data.type === "income" && data.allocationBucket !== null) {
        return false;
      }
      return true;
    },
    {
      message: "Income categories cannot have an allocation bucket",
      path: ["allocationBucket"],
    },
  );

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  allocationBucket: allocationBucketEnum.nullable().optional(),
  icon: z.string().max(10).optional(),
});

export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type AllocationBucket = z.infer<typeof allocationBucketEnum>;
