import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "@/lib/validations/budgets";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/categories";
import {
  createFinancialProfileSchema,
  updateFinancialProfileSchema,
} from "@/lib/validations/financial-profile";
import {
  createRecurringSchema,
  updateRecurringSchema,
} from "@/lib/validations/recurring";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transactions";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

function paths(issues: ZodIssue[]): string[] {
  return issues.map((issue) => issue.path.join("."));
}

describe("createBudgetSchema", () => {
  const valid = {
    categoryId: UUID,
    amount: 500,
    period: "monthly" as const,
    startDate: "2026-03-01",
  };

  it("accepts a well-formed budget", () => {
    expect(createBudgetSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-uuid category", () => {
    const result = createBudgetSchema.safeParse({
      ...valid,
      categoryId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["categoryId"]);
  });

  it("rejects a zero or negative amount", () => {
    for (const amount of [0, -1]) {
      const result = createBudgetSchema.safeParse({ ...valid, amount });
      expect(result.success).toBe(false);
      expect(paths(result.error!.issues)).toEqual(["amount"]);
    }
  });

  it("does not coerce a string amount", () => {
    const result = createBudgetSchema.safeParse({ ...valid, amount: "500" });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["amount"]);
  });

  it("rejects an unknown period", () => {
    const result = createBudgetSchema.safeParse({ ...valid, period: "yearly" });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["period"]);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    for (const startDate of ["01/03/2026", "2026-3-1", "2026-03-01T00:00:00Z"]) {
      const result = createBudgetSchema.safeParse({ ...valid, startDate });
      expect(result.success).toBe(false);
      expect(result.error!.issues[0].message).toBe("Date must be YYYY-MM-DD");
    }
  });

  it("reports every invalid field at once", () => {
    const result = createBudgetSchema.safeParse({
      categoryId: "nope",
      amount: -1,
      period: "hourly",
      startDate: "yesterday",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues).sort()).toEqual([
      "amount",
      "categoryId",
      "period",
      "startDate",
    ]);
  });
});

describe("updateBudgetSchema", () => {
  it("accepts an empty patch", () => {
    expect(updateBudgetSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial patch", () => {
    expect(updateBudgetSchema.safeParse({ amount: 750 }).success).toBe(true);
  });

  it("still validates the fields that are present", () => {
    const result = updateBudgetSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["amount"]);
  });
});

describe("createCategorySchema", () => {
  it("accepts an expense category with a bucket", () => {
    const result = createCategorySchema.safeParse({
      name: "Groceries",
      type: "expense",
      icon: "🛒",
      allocationBucket: "needs",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an income category without a bucket", () => {
    const result = createCategorySchema.safeParse({
      name: "Salary",
      type: "income",
    });
    expect(result.success).toBe(true);
  });

  it("requires a bucket on expense categories", () => {
    const result = createCategorySchema.safeParse({
      name: "Groceries",
      type: "expense",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "Allocation bucket is required for expense categories",
    );
    expect(paths(result.error!.issues)).toEqual(["allocationBucket"]);
  });

  it("rejects an empty or over-long name", () => {
    for (const name of ["", "x".repeat(101)]) {
      const result = createCategorySchema.safeParse({
        name,
        type: "income",
      });
      expect(result.success).toBe(false);
      expect(paths(result.error!.issues)).toContain("name");
    }
  });

  it("rejects an unknown bucket", () => {
    const result = createCategorySchema.safeParse({
      name: "Groceries",
      type: "expense",
      allocationBucket: "savings",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["allocationBucket"]);
  });

  it("rejects an icon longer than 10 characters", () => {
    const result = createCategorySchema.safeParse({
      name: "Groceries",
      type: "income",
      icon: "x".repeat(11),
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["icon"]);
  });
});

describe("updateCategorySchema", () => {
  it("accepts an empty patch", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(true);
  });

  it("accepts a bucket change on its own", () => {
    expect(
      updateCategorySchema.safeParse({ allocationBucket: "wants" }).success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = updateCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["name"]);
  });
});

describe("createFinancialProfileSchema", () => {
  it("fills in the 50/30/20 defaults and USD", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      needsPercentage: 50,
      wantsPercentage: 30,
      futurePercentage: 20,
      currency: "USD",
    });
  });

  it("coerces numeric strings from form payloads", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: "5000",
      needsPercentage: "60",
      wantsPercentage: "25",
      futurePercentage: "15",
    });
    expect(result.success).toBe(true);
    expect(result.data!.monthlyIncomeTarget).toBe(5000);
    expect(result.data!.needsPercentage).toBe(60);
  });

  it("rejects a zero monthly income", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 0,
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "Monthly income must be greater than 0",
    );
  });

  it("rejects percentages that do not sum to 100", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
      needsPercentage: 50,
      wantsPercentage: 30,
      futurePercentage: 30,
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "Percentages must sum to 100",
    );
    expect(paths(result.error!.issues)).toEqual(["needsPercentage"]);
  });

  it("tolerates rounding noise within a hundredth of a point", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
      needsPercentage: 33.33,
      wantsPercentage: 33.33,
      futurePercentage: 33.34,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a percentage outside 0-100", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
      needsPercentage: 120,
      wantsPercentage: -20,
      futurePercentage: 0,
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues).sort()).toEqual([
      "needsPercentage",
      "wantsPercentage",
    ]);
  });

  it("rejects an unsupported currency", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
      currency: "XXX",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("Unsupported currency code");
  });

  it("rejects a currency code that is not three characters", () => {
    const result = createFinancialProfileSchema.safeParse({
      monthlyIncomeTarget: 5000,
      currency: "US",
    });
    expect(result.success).toBe(false);
    expect(new Set(paths(result.error!.issues))).toEqual(new Set(["currency"]));
  });
});

describe("updateFinancialProfileSchema", () => {
  it("accepts an empty patch", () => {
    expect(updateFinancialProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts an income-only patch", () => {
    expect(
      updateFinancialProfileSchema.safeParse({ monthlyIncomeTarget: 6000 })
        .success,
    ).toBe(true);
  });

  it("accepts all three percentages when they sum to 100", () => {
    expect(
      updateFinancialProfileSchema.safeParse({
        needsPercentage: 60,
        wantsPercentage: 20,
        futurePercentage: 20,
      }).success,
    ).toBe(true);
  });

  it("rejects a patch that changes only one percentage", () => {
    const result = updateFinancialProfileSchema.safeParse({
      needsPercentage: 60,
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "If updating percentages, all three must be provided and sum to 100",
    );
  });

  it("rejects all three percentages when they do not sum to 100", () => {
    const result = updateFinancialProfileSchema.safeParse({
      needsPercentage: 60,
      wantsPercentage: 20,
      futurePercentage: 30,
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["needsPercentage"]);
  });
});

describe("createTransactionSchema", () => {
  const valid = {
    amount: 42.5,
    type: "expense" as const,
    date: "2026-03-01",
  };

  it("accepts a minimal transaction and defaults both currencies to USD", () => {
    const result = createTransactionSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ currency: "USD", baseCurrency: "USD" });
  });

  it("coerces a string amount from the form", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      amount: "42.50",
    });
    expect(result.success).toBe(true);
    expect(result.data!.amount).toBe(42.5);
  });

  it("rejects a zero amount", () => {
    const result = createTransactionSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "Amount must be greater than 0",
    );
  });

  it("rejects an amount that is not numeric at all", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      amount: "abc",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["amount"]);
  });

  it("rejects an unknown type", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      type: "transfer",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["type"]);
  });

  it("rejects a description over 255 characters", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      description: "x".repeat(256),
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["description"]);
  });

  it("rejects a currency the app does not support", () => {
    const result = createTransactionSchema.safeParse({
      ...valid,
      currency: "ZZZ",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("Unsupported currency code");
  });
});

describe("updateTransactionSchema", () => {
  it("requires baseCurrency so the rate can be recomputed", () => {
    const result = updateTransactionSchema.safeParse({ amount: 10 });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["baseCurrency"]);
  });

  it("accepts a patch carrying only baseCurrency", () => {
    expect(
      updateTransactionSchema.safeParse({ baseCurrency: "EUR" }).success,
    ).toBe(true);
  });

  it("accepts an explicit null categoryId", () => {
    const result = updateTransactionSchema.safeParse({
      baseCurrency: "USD",
      categoryId: null,
    });
    expect(result.success).toBe(true);
    expect(result.data!.categoryId).toBeNull();
  });
});

describe("createRecurringSchema", () => {
  const valid = {
    amount: 100,
    type: "expense" as const,
    frequency: "monthly" as const,
    startDate: "2026-01-31",
  };

  it("accepts a minimal recurring item and defaults both currencies to USD", () => {
    const result = createRecurringSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ currency: "USD", baseCurrency: "USD" });
  });

  it("accepts every supported frequency", () => {
    for (const frequency of [
      "daily",
      "weekly",
      "biweekly",
      "monthly",
      "quarterly",
      "yearly",
    ]) {
      expect(
        createRecurringSchema.safeParse({ ...valid, frequency }).success,
      ).toBe(true);
    }
  });

  it("rejects an unknown frequency", () => {
    const result = createRecurringSchema.safeParse({
      ...valid,
      frequency: "fortnightly",
    });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["frequency"]);
  });

  it("accepts an end date equal to the start date", () => {
    expect(
      createRecurringSchema.safeParse({ ...valid, endDate: valid.startDate })
        .success,
    ).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = createRecurringSchema.safeParse({
      ...valid,
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe(
      "End date must be on or after start date",
    );
    expect(paths(result.error!.issues)).toEqual(["endDate"]);
  });

  it("does not coerce a string amount", () => {
    const result = createRecurringSchema.safeParse({ ...valid, amount: "100" });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["amount"]);
  });
});

describe("updateRecurringSchema", () => {
  it("accepts a bare pause toggle", () => {
    const result = updateRecurringSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts clearing the end date with null", () => {
    const result = updateRecurringSchema.safeParse({ endDate: null });
    expect(result.success).toBe(true);
    expect(result.data!.endDate).toBeNull();
  });

  it("rejects a null start date", () => {
    const result = updateRecurringSchema.safeParse({ startDate: null });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["startDate"]);
  });

  it("rejects a non-boolean isActive", () => {
    const result = updateRecurringSchema.safeParse({ isActive: "true" });
    expect(result.success).toBe(false);
    expect(paths(result.error!.issues)).toEqual(["isActive"]);
  });
});
