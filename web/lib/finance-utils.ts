import type { AllocationBucket } from "@/types";

// ─── Bucket Definitions ───────────────────────────────────────────────────────

export const BUCKET_DEFINITIONS = {
  needs: {
    label: "Needs",
    color: "#8b9a7e",
    defaultPercentage: 50,
    description: "Essential expenses",
  },
  wants: {
    label: "Wants",
    color: "#c97a5a",
    defaultPercentage: 30,
    description: "Non-essential spending",
  },
  future: {
    label: "Future",
    color: "#a89562",
    defaultPercentage: 20,
    description: "Savings & investments",
  },
} as const satisfies Record<
  AllocationBucket,
  { label: string; color: string; defaultPercentage: number; description: string }
>;

export const BUCKET_ORDER: AllocationBucket[] = ["needs", "wants", "future"];

// ─── Color Mappings ───────────────────────────────────────────────────────────

export function getBucketColor(bucket: AllocationBucket | null): string {
  if (!bucket) return "#888888";
  return BUCKET_DEFINITIONS[bucket].color;
}

export function getTransactionColor(type: "income" | "expense"): string {
  return type === "income" ? "#6aaa6a" : "#e05252";
}

// ─── Currency Formatter ───────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return currencyFormatter.format(num);
}

export function formatCurrencyCompact(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Math.abs(num) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }
  return currencyFormatter.format(num);
}

// ─── Percentage Calculator ────────────────────────────────────────────────────

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function calculateBucketTarget(
  monthlyIncome: number,
  percentage: number
): number {
  return (monthlyIncome * percentage) / 100;
}
